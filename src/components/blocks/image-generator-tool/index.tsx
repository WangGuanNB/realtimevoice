"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Icon from "@/components/icon";
import { useAppContext } from "@/contexts/app";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import Pricing from "@/components/blocks/pricing";
import type { Pricing as PricingType } from "@/types/blocks/pricing";
import { toast } from "sonner";

const PROMPT_MAX_LENGTH = 5000;
const RESOLUTIONS = ["1K", "2K", "4K"] as const;
const ASPECT_RATIOS = [
  { value: "auto", label: "Auto" },
  { value: "1:1", label: "1:1" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
  { value: "5:4", label: "5:4" },
  { value: "4:5", label: "4:5" },
  { value: "21:9", label: "21:9" },
] as const;

interface ImageGeneratorToolProps {
  /** When true, render form only (no section/header) for embedding in Hero */
  embed?: boolean;
  /** Credits required per generation (from AI_CHAT_CREDIT_COST) */
  creditCost?: number;
  /** Full pricing data for insufficient credits modal (same as /pricing page) */
  pricing?: PricingType | null;
  tool?: {
    title?: string;
    description?: string;
    promptPlaceholder?: string;
    buttonText?: string;
    generatingText?: string;
  };
}

// Placeholder image for demo (use project asset)
const PLACEHOLDER_IMAGE = "/imgs/features/1.webp";

export default function ImageGeneratorTool({
  tool,
  embed = false,
  creditCost = 10,
  pricing = null,
}: ImageGeneratorToolProps) {
  const { user, setShowSignModal, fetchUserInfo } = useAppContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState<(typeof RESOLUTIONS)[number]>("2K");
  const [aspectRatio, setAspectRatio] = useState<string>("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const leftCredits = user?.credits?.left_credits ?? 0;

  // 进入页面时刷新用户信息（含积分），确保支付后能看到最新积分
  useEffect(() => {
    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅 mount 时拉取一次
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // 1. 未登录 -> 打开登录
    if (!user) {
      setShowSignModal(true);
      return;
    }

    // 2. 积分不足 -> 弹出套餐页面（与 /pricing 一致）
    if (leftCredits < creditCost) {
      if (pricing && !pricing.disabled) {
        setPricingModalOpen(true);
      } else {
        toast.error("Insufficient credits. Please upgrade your plan.");
      }
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // 3. 调用消耗积分 API
      const resp = await fetch("/api/consume-image-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const res = await resp.json();

      if (res.code === -2) {
        setShowSignModal(true);
        setIsGenerating(false);
        return;
      }

      if (res.code === -3 && res.data?.insufficient) {
        if (pricing && !pricing.disabled) {
          setPricingModalOpen(true);
        } else {
          toast.error("Insufficient credits. Please upgrade your plan.");
        }
        setIsGenerating(false);
        return;
      }

      if (res.code !== 0) {
        toast.error(res.message ?? "Failed to consume credits");
        setIsGenerating(false);
        return;
      }

      // 4. 积分已扣除，模拟生成（2–3 秒）
      await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
      setGeneratedImage(PLACEHOLDER_IMAGE);

      // 5. 异步刷新用户积分
      fetchUserInfo?.();
    } catch (e) {
      console.error("Generate failed:", e);
      toast.error("Generate failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePricingModalClose = (open: boolean) => {
    setPricingModalOpen(open);
    if (!open) {
      fetchUserInfo?.();
    }
  };

  const pricingModalContent = pricing && (
    <>
      {isDesktop ? (
        <Dialog open={pricingModalOpen} onOpenChange={handlePricingModalClose}>
          <DialogContent className="max-w-[min(95vw,64rem)] w-full max-h-[95vh] flex flex-col p-4 sm:p-6">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Insufficient Credits</DialogTitle>
              <DialogDescription>
                Purchase credits to continue generating images.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
              <Pricing pricing={pricing} showGroups embed />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={pricingModalOpen} onOpenChange={handlePricingModalClose}>
          <DrawerContent className="max-h-[95vh] flex flex-col">
            <DrawerHeader className="flex-shrink-0">
              <DrawerTitle>Insufficient Credits</DrawerTitle>
              <DrawerDescription>
                Purchase credits to continue generating images.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
              <Pricing pricing={pricing} showGroups embed />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );

  const inputPanel = (
    <div className="flex flex-col gap-6">
      {/* Prompt */}
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-sm font-medium">
          Prompt
        </Label>
        <div className="relative">
          <Textarea
            id="prompt"
            placeholder="Describe the image you want to create in detail..."
            value={prompt}
            onChange={(e) =>
              setPrompt(e.target.value.slice(0, PROMPT_MAX_LENGTH))
            }
            className="min-h-[160px] resize-y text-base pr-16"
            disabled={isGenerating}
            rows={6}
          />
          <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">
            {prompt.length}/{PROMPT_MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* Resolution */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Resolution</Label>
        <div className="flex gap-2">
          {RESOLUTIONS.map((r) => (
            <Button
              key={r}
              type="button"
              variant={resolution === r ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setResolution(r)}
              disabled={isGenerating}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Aspect Ratio</Label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {ASPECT_RATIOS.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant={aspectRatio === value ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setAspectRatio(value)}
              disabled={isGenerating}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
      >
        {isGenerating ? (
          <>
            <Icon
              name="RiLoader4Line"
              className="mr-2 size-5 animate-spin"
            />
            {tool?.generatingText ?? "Generating..."}
          </>
        ) : (
          <>
            <Icon name="RiImageAddLine" className="mr-2 size-5" />
            {tool?.buttonText ?? "Generate Image"}
          </>
        )}
      </Button>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          Credits required: <strong className="font-semibold text-foreground">{creditCost}</strong>
        </span>
        <span className="text-muted-foreground/60">|</span>
        <span>
          Available Credits: <strong className="font-semibold text-foreground">{user?.credits?.left_credits ?? 0}</strong>
        </span>
      </div>
    </div>
  );

  const previewPanel = (
    <div className="flex min-h-[400px] items-center justify-center overflow-hidden rounded-xl border bg-muted/50 lg:min-h-[520px]">
      {generatedImage ? (
        <img
          src={generatedImage}
          alt="Generated result"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Icon name="RiPaletteLine" className="size-8 text-primary" />
          </div>
          <p className="font-semibold">Ready to Create</p>
          <p className="text-sm text-muted-foreground">
            Describe the image you want to create and we&apos;ll generate it for you.
          </p>
        </div>
      )}
    </div>
  );

  const toolContent = (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="flex flex-col">{inputPanel}</div>
      <div className="flex flex-col">{previewPanel}</div>
    </div>
  );

  if (embed) {
    return (
      <div id="generator" className="w-full">
        <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          {toolContent}
        </div>
        {pricingModalContent}
      </div>
    );
  }

  return (
    <section id="generator" className="py-12 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
            <header className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold md:text-3xl">
                {tool?.title ?? "Create Your Image"}
              </h2>
              <p className="text-muted-foreground">
                {tool?.description ??
                  "Describe your image in words and generate it instantly."}
              </p>
            </header>
            {toolContent}
          </div>
        </div>
      </div>
      {pricingModalContent}
    </section>
  );
}
