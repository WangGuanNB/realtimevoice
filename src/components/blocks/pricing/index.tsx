"use client";

import { Check, Loader } from "lucide-react";
import { PricingItem, Pricing as PricingType } from "@/types/blocks/pricing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Label } from "@/components/ui/label";
import { usePayment } from "@/hooks/usePayment";
import { useAppContext } from "@/contexts/app";
import { useLocale } from "next-intl";
import { PaymentMethodSelector } from "@/components/payment/PaymentMethodSelector";

interface PricingProps {
  pricing: PricingType;
  /** 是否显示 Monthly/Yearly 切换，默认 true。首页预览可设为 false */
  showGroups?: boolean;
  /** 嵌入模式（用于弹层内展示），精简 padding 和标题 */
  embed?: boolean;
}

export default function Pricing({ pricing, showGroups = true, embed = false }: PricingProps) {
  if (pricing.disabled) {
    return null;
  }

  const locale = useLocale();

  const { user } = useAppContext();
  const {
    handleCheckout: handlePayment,
    handlePaymentMethodSelect,
    isLoading,
    productId,
    showPaymentSelector,
    setShowPaymentSelector,
  } = usePayment();

  const [group, setGroup] = useState(
    pricing.groups?.[0]?.name ?? pricing.items?.[0]?.group ?? ""
  );

  // 当前组下可见的 items，用于计算默认选中
  const visibleItems = pricing.items?.filter(
    (i) => !i.group || i.group === (showGroups && pricing.groups?.length ? group : pricing.groups?.[0]?.name ?? "")
  ) ?? [];
  const defaultSelectedKey = visibleItems.find((i) => i.is_featured) ?? visibleItems[0];
  const getItemKey = (item: PricingItem) => `${item.product_id}-${item.group ?? ""}`;

  const [selectedKey, setSelectedKey] = useState<string>(() =>
    defaultSelectedKey ? getItemKey(defaultSelectedKey) : ""
  );

  useEffect(() => {
    const items = pricing.items?.filter(
      (i) => !i.group || i.group === (showGroups && pricing.groups?.length ? group : pricing.groups?.[0]?.name ?? "")
    ) ?? [];
    const next = items.find((i) => i.is_featured) ?? items[0];
    setSelectedKey(next ? `${next.product_id}-${next.group ?? ""}` : "");
  }, [group, pricing.items, pricing.groups, showGroups]);

  const handleCheckout = async (item: PricingItem) => {
    await handlePayment(item, false); // 只使用国际支付
  };

  useEffect(() => {
    if (pricing.groups?.length) {
      setGroup(pricing.groups[0].name ?? "");
    } else if (pricing.items?.length && pricing.items[0].group) {
      setGroup(pricing.items[0].group);
    }
  }, [pricing.groups, pricing.items]);

  const Wrapper = embed ? "div" : "section";

  return (
    <Wrapper id={embed ? undefined : pricing.name} className={embed ? "py-4" : "py-16"}>
      <div className={embed ? "w-full px-0" : "container"}>
        {!embed && (
          <div className="mx-auto mb-12 text-center">
            <h2 className="mb-4 text-4xl font-semibold lg:text-5xl">
              {pricing.title}
            </h2>
            <p className="text-muted-foreground lg:text-lg">
              {pricing.description}
            </p>
          </div>
        )}
        <div className="w-full flex flex-col items-center gap-2">
          {showGroups && pricing.groups && pricing.groups.length > 0 && (
            <div className={`flex h-12 items-center rounded-md bg-muted p-1 text-lg ${embed ? "mb-4" : "mb-12"}`}>
              <RadioGroup
                value={group}
                className={`grid h-full w-full max-w-xs mx-auto gap-1`}
                style={{ gridTemplateColumns: `repeat(${pricing.groups.length}, 1fr)` }}
                onValueChange={(value) => {
                  setGroup(value);
                }}
              >
                {pricing.groups.map((item, i) => {
                  return (
                    <div
                      key={i}
                      className="h-full rounded-md transition-all has-[button[data-state=checked]]:bg-background has-[button[data-state=checked]]:shadow-sm"
                    >
                      <RadioGroupItem
                        value={item.name || ""}
                        id={item.name}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={item.name}
                        className="flex h-full cursor-pointer items-center justify-center px-7 font-semibold text-muted-foreground peer-data-[state=checked]:text-primary"
                      >
                        {item.title}
                        {item.label && (
                          <Badge
                            variant="outline"
                            className="border-primary bg-primary px-1.5 ml-1 text-primary-foreground"
                          >
                            {item.label}
                          </Badge>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}
          <div className="w-full mt-0 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {pricing.items?.map((item, index) => {
              const effectiveGroup = showGroups && pricing.groups?.length ? group : (pricing.groups?.[0]?.name ?? "");
              if (item.group && item.group !== effectiveGroup) {
                return null;
              }

              const itemKey = getItemKey(item);
              const isSelected = selectedKey === itemKey;

              return (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedKey(itemKey)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedKey(itemKey);
                    }
                  }}
                  className={`rounded-lg cursor-pointer transition-all ${
                    embed ? "p-4" : "p-6"
                  } ${
                    isSelected
                      ? "border-primary border-2 bg-card text-card-foreground ring-2 ring-primary/20"
                      : "border-muted border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`flex h-full flex-col justify-between ${embed ? "gap-3" : "gap-5"}`}>
                    <div>
                      <div className={`flex items-center gap-2 ${embed ? "mb-2" : "mb-4"}`}>
                        {item.title && (
                          <h3 className={`font-semibold ${embed ? "text-lg" : "text-xl"}`}>
                            {item.title}
                          </h3>
                        )}
                        <div className="flex-1"></div>
                        {item.label && (
                          <Badge
                            variant="outline"
                            className="border-primary bg-primary px-1.5 text-primary-foreground"
                          >
                            {item.label}
                          </Badge>
                        )}
                      </div>
                      <div className={`flex items-end gap-2 ${embed ? "mb-2" : "mb-4"}`}>
                        {item.original_price && (
                          <span className={`text-muted-foreground font-semibold line-through ${embed ? "text-base" : "text-xl"}`}>
                            {item.original_price}
                          </span>
                        )}
                        {item.price && (
                          <span className={`font-semibold ${embed ? "text-3xl" : "text-5xl"}`}>
                            {item.price}
                          </span>
                        )}
                        {(item.unit || item.unit_note) && (
                          <span className="block text-sm font-medium text-muted-foreground">
                            {item.unit}
                            {item.unit_note && ` · ${item.unit_note}`}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      {item.features_title && (
                        <p className={`font-semibold ${embed ? "mb-2 mt-3" : "mb-3 mt-6"}`}>
                          {item.features_title}
                        </p>
                      )}
                      {item.features && (
                        <ul className={`flex flex-col ${embed ? "gap-1.5" : "gap-3"}`}>
                          {(embed ? item.features.slice(0, 4) : item.features).map((feature, fi) => {
                            return (
                              <li className="flex gap-2" key={`feature-${fi}`}>
                                <Check className="mt-1 size-4 shrink-0" />
                                {feature}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {item.button && (
                        <Button
                          className="w-full flex items-center justify-center gap-2 font-semibold"
                          disabled={isLoading}
                          onClick={() => {
                            if (isLoading) {
                              return;
                            }
                            handleCheckout(item);
                          }}
                        >
                          {(!isLoading ||
                            (isLoading && productId !== item.product_id)) && (
                            <p>{item.button.title}</p>
                          )}

                          {isLoading && productId === item.product_id && (
                            <p>{item.button.title}</p>
                          )}
                          {isLoading && productId === item.product_id && (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {item.button.icon && (
                            <Icon name={item.button.icon} className="size-4" />
                          )}
                        </Button>
                      )}
                      {item.tip && (
                        <p className="text-muted-foreground text-sm mt-2">
                          {item.tip}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 支付方式选择对话框 - 与 Pricing 页面共用 */}
      <PaymentMethodSelector
        open={showPaymentSelector}
        onOpenChange={setShowPaymentSelector}
        onSelect={handlePaymentMethodSelect}
      />
    </Wrapper>
  );
}
