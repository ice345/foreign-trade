UPDATE "Resource" SET "platform" = BTRIM("platform") WHERE "platform" <> BTRIM("platform");
UPDATE "Resource" SET "platform" = 'Facebook' WHERE "platform" IN ('Facebook 群组', 'Facebook Group');
UPDATE "Resource" SET "platform" = 'Telegram' WHERE "platform" IN ('Telegram 频道', 'Telegram Channel');
UPDATE "Resource" SET "platform" = 'TikTok' WHERE "platform" IN ('TikTok 红人', 'TikTok Influencer');
UPDATE "Resource" SET "platform" = 'Deal 站' WHERE "platform" IN ('Deal 站编辑', 'Deal Editor');
