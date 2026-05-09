"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";

import { MdLanguage } from "react-icons/md";
import { localeNames } from "@/i18n/locale";

export default function ({ isIcon = false }: { isIcon?: boolean }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // 获取当前语言，如果没有locale参数则说明是默认语言（英文）
  const locale = (params.locale as string) || "en";

  const handleSwitchLanguage = (value: string) => {
    if (value !== locale) {
      let newPath = '';
      
      if (value === 'en') {
        // 英文是默认语言，不需要前缀
        if (pathname === '/zh') {
          newPath = '/';
        } else {
          newPath = pathname.replace(/^\/zh/, '') || '/';
        }
      } else {
        // 中文需要前缀
        if (pathname === '/' || !pathname.startsWith('/')) {
          newPath = `/${value}`;
        } else if (pathname.startsWith('/zh')) {
          newPath = pathname.replace(/^\/zh/, `/${value}`);
        } else {
          newPath = `/${value}${pathname}`;
        }
      }
      
      window.location.href = newPath;
    }
  };

  return (
    <Select value={locale || "en"} onValueChange={handleSwitchLanguage}>
      <SelectTrigger className="flex items-center gap-2 border-none text-muted-foreground outline-hidden hover:bg-transparent focus:ring-0 focus:ring-offset-0">
        <MdLanguage className="text-xl" />
        {!isIcon && (
          <span className="hidden md:block">{localeNames[locale]}</span>
        )}
      </SelectTrigger>
      <SelectContent className="z-50 bg-background">
        {Object.keys(localeNames).map((key: string) => {
          const name = localeNames[key];
          return (
            <SelectItem className="cursor-pointer px-4" key={key} value={key}>
              {name}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
