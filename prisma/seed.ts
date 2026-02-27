import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@globalpush.io" },
    update: {},
    create: {
      email: "admin@globalpush.io",
      password,
      role: "ADMIN"
    }
  });

  const resources = [
    {
      title: "Home Deals Facebook Group",
      description: "美国大型家居优惠群组，适合家居类目推广。",
      category: "家居",
      country: "美国",
      badge: "爆单王",
      followers: 180000,
      tags: ["家居", "deal", "facebook"],
      platform: "Facebook 群组",
      link: "https://www.facebook.com/groups/TheFrugalFind",
      image: "https://images.unsplash.com/photo-1487014679447-9f8336841d58",
      price: 299,
      status: "ACTIVE"
    },
    {
      title: "UK Tech Deal Editor",
      description: "英国电子类 Deal 站编辑合作入口，适合 3C 产品推广。",
      category: "电子",
      country: "英国",
      badge: "性价比高",
      followers: 95000,
      tags: ["电子", "deal", "编辑"],
      platform: "Deal 站编辑",
      link: "https://www.dealnews.com",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
      price: 199,
      status: "ACTIVE"
    },
    {
      title: "JP Beauty Influencer",
      description: "日本美妆垂类 TikTok 红人，内容真实、转化稳定。",
      category: "美妆",
      country: "日本",
      badge: "清仓首选",
      followers: 320000,
      tags: ["美妆", "tiktok", "达人"],
      platform: "TikTok 红人",
      link: "https://www.tiktok.com",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f",
      price: 459,
      status: "ACTIVE"
    },
    {
      title: "US Gadget Telegram",
      description: "美国电子产品 Telegram 频道，适合快速清库存。",
      category: "电子",
      country: "美国",
      badge: "清仓首选",
      followers: 68000,
      tags: ["telegram", "电子", "deal"],
      platform: "Telegram 频道",
      link: "https://t.me",
      image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
      price: 129,
      status: "ACTIVE"
    },
    {
      title: "EU Fashion Deal Editor",
      description: "德国时尚类 Deal 编辑入口，适合服饰类推广。",
      category: "服饰",
      country: "德国",
      badge: "爆单王",
      followers: 120000,
      tags: ["时尚", "deal", "服饰"],
      platform: "Deal 站编辑",
      link: "https://www.edealinfo.com",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
      price: 259,
      status: "ACTIVE"
    },
    {
      title: "US Fashion FB Group",
      description: "美国服饰特卖社群，爆款转化率高。",
      category: "服饰",
      country: "美国",
      badge: "性价比高",
      followers: 210000,
      tags: ["服饰", "facebook", "deal"],
      platform: "Facebook 群组",
      link: "https://www.facebook.com",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
      price: 89,
      status: "ACTIVE"
    },
    {
      title: "JP Beauty Telegram",
      description: "日本美妆折扣频道，适合美妆产品快速分发。",
      category: "美妆",
      country: "日本",
      badge: "新品首选",
      followers: 54000,
      tags: ["美妆", "telegram", "折扣"],
      platform: "Telegram 频道",
      link: "https://t.me",
      image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
      price: 59,
      status: "ACTIVE"
    }
  ];

  await prisma.resource.createMany({ data: resources });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
