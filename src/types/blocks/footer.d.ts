import { Brand, Social, Nav, Agreement, Image } from "@/types/blocks/base";

export interface Badge {
  title: string;
  url: string;
  target?: string;
  image: Image;
}

export interface Footer {
  disabled?: boolean;
  name?: string;
  brand?: Brand;
  nav?: Nav;
  copyright?: string;
  social?: Social;
  agreement?: Agreement;
  badge?: Badge; // 保持向后兼容
  badges?: Badge[];
}
