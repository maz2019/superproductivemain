"use client";

import { NodeProps, useReactFlow } from "reactflow";
import { NodeWrapper } from "./NodeWrapper";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { textNodeSchema, TextNodeSchema } from "@/schema/nodesSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { useOnEditNode } from "@/hooks/react_flow/useOnEditNode";
import { MindMapItemColors } from "@/types/enums";
import { useAutosaveIndicator } from "@/context/AutosaveIndicator";
import { useAutoSaveMindMap } from "@/context/AutoSaveMindMap";
import { useDebouncedCallback } from "use-debounce";
import { useTranslations } from "next-intl";

type NodeData = {
  text: string;
  color: MindMapItemColors;
  onDelete: () => void;
};

export const TextNode = ({ data, id }: NodeProps<NodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const _nodeText = useRef<HTMLTextAreaElement>(null);

  const { setNodes } = useReactFlow();
  const { onSetStatus } = useAutosaveIndicator();
  const { onSave } = useAutoSaveMindMap();

  const debouncedMindMapInfo = useDebouncedCallback(() => {
    onSetStatus("pending");
    onSave();
  }, 3000);

  const onSaveNode = useCallback(
    (nodeId: string, nodeText: string) => {
      setNodes((prevNodes) => {
        const nodes = prevNodes.map((node: any) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, text: nodeText } }
            : node
        );
        return nodes;
      });
      onSetStatus("unsaved");
      debouncedMindMapInfo();
    },
    [setNodes, debouncedMindMapInfo, onSetStatus]
  );
  const t = useTranslations("MIND_MAP.NODE");

  const form = useForm<TextNodeSchema>({
    resolver: zodResolver(textNodeSchema),
    defaultValues: {
      text: t("PLACEHOLDER"),
    },
  });

  const onIsEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const onSubmit = (data: TextNodeSchema) => {
    console.log(data);
    onSaveNode(id, data.text);
    onIsEdit();
  };

  useEffect(() => {
    form.reset({
      text: data.text ? data.text.toString() : t("PLACEHOLDER"),
    });
  }, [data.text, form, isEditing, t]);

  const { ref: nodeText, ...rest } = form.register("text");

  return (
    <NodeWrapper
      nodeId={id}
      color={data.color}
      isEditing={true}
      onIsEdit={onIsEdit}
      onDelete={data.onDelete}
    >
      <div className="w-full py-1.5">
        {isEditing ? (
          <form id="node-text-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <TextAreaAutosize
                placeholder={t("PLACEHOLDER")}
                {...rest}
                ref={(e) => {
                  nodeText(e);
                  //@ts-ignore
                  _nodeText.current = e;
                }}
                className="w-[26.5rem] min-h-[4rem] resize-none appearance-none overflow-hidden bg-transparent placeholder:text-muted-foreground font-semibold focus:outline-none"
              />
            </div>

            <div className="w-full flex justify-end mt-4 gap-2">
              <Button
                type="button"
                onClick={onIsEdit}
                variant={"ghost"}
                className=" py-1.5 sm:py:1.5 h-fit border"
                size={"sm"}
              >
                {t("CANCEL")}
              </Button>
              <Button
                type="submit"
                className=" py-1.5 sm:py-1.5 h-fit border"
                size={"sm"}
                variant={"ghost"}
              >
                {t("SAVE")}
              </Button>
            </div>
          </form>
        ) : (
          <p className="w-full break-words">
            {data.text ? data.text : t("PLACEHOLDER")}
          </p>
        )}
      </div>
    </NodeWrapper>
  );
};
