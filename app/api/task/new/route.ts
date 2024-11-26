import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotifyType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return new Response("Unauthorized", {
      status: 400,
      statusText: "Unauthorized User",
    });
  }

  const newTaskSchema = z.object({
    workspaceId: z.string(),
  });

  const body: unknown = await request.json();

  const result = newTaskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json("ERRORS.WRONG_DATA", { status: 401 });
  }

  const { workspaceId } = result.data;

  try {
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        subscriptions: {
          where: {
            workspaceId: workspaceId,
          },
          select: {
            userRole: true,
          },
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", {
        status: 404,
        statusText: "User not Found",
      });
    }

    if (user.subscriptions[0].userRole === "READ_ONLY") {
      return NextResponse.json("ERRORS.NO_PERMISSION", { status: 403 });
    }

    const date = await db.taskDate.create({
      data: {
        from: undefined,
        to: undefined,
      },
    });

    const task = await db.task.create({
      data: {
        title: "",
        creatorId: user.id,
        workspaceId,
        dateId: date.id,
      },
    });

    await db.task.update({
      where: {
        id: task.id,
      },
      data: {
        updatedUserId: session.user.id,
      },
    });

    const workspaceUsers = await db.subscription.findMany({
      where: {
        workspaceId,
      },
      select: {
        userId: true,
      },
    });

    const notificationsData = workspaceUsers.map((user) => ({
      notifyCreatorId: session.user.id,
      userId: user.userId,
      workspaceId,
      notifyType: NotifyType.NEW_TASK,
      taskId: task.id,
    }));

    const filterNotificationsData = notificationsData.filter(
      (data) => data.userId !== session.user.id
    );

    await db.notification.createMany({
      data: filterNotificationsData,
    });

    return NextResponse.json(task, { status: 200 });
  } catch (_) {
    return NextResponse.json("ERRORS.DB_ERROR", { status: 405 });
  }
}
