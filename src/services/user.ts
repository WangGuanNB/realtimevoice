import { CreditsTransType } from "./credit";
import { findUserByEmail, findUserByUuid, insertUser } from "@/models/user";

import { User } from "@/types/user";
import { auth } from "@/auth";
import { getIsoTimestr, getOneYearLaterTimestr } from "@/lib/time";
import { getUserUuidByApiKey } from "@/models/apikey";
import { headers } from "next/headers";
import { increaseCredits } from "./credit";
import { users } from "@/db/schema";
import { getUuid } from "@/lib/hash";
import { getNewUserCredits } from "./config";

// save user to database, if user not exist, create a new user
export async function saveUser(user: User) {
  try {
    if (!user.email) {
      throw new Error("invalid user email");
    }

    const existUser = await findUserByEmail(user.email);

    if (!existUser) {
      // user not exist, create a new user
      if (!user.uuid) {
        user.uuid = getUuid();
      }

      console.log("user to be inserted:", user);

      try {
        const dbUser = await insertUser(user as typeof users.$inferInsert);

        // increase credits for new user, expire in one year
        await increaseCredits({
          user_uuid: user.uuid,
          trans_type: CreditsTransType.NewUser,
          credits: getNewUserCredits(), // 从配置读取新用户积分（默认 1000）
          expired_at: getOneYearLaterTimestr(),
        });

        user = {
          ...(dbUser as unknown as User),
        };
      } catch (insertErr: any) {
        // 并发请求（如 Next-Auth 多次触发 JWT callback）可能导致两个请求同时通过
        // existUser 检查，然后都尝试插入，第二个会触发唯一约束冲突
        // 这里捕获该错误并回退查询已存在的用户
        const isUniqueConflict =
          insertErr?.message?.includes("UNIQUE constraint failed") ||
          insertErr?.cause?.message?.includes("UNIQUE constraint failed");
        if (isUniqueConflict) {
          const conflictUser = await findUserByEmail(user.email);
          if (conflictUser) {
            user = { ...(conflictUser as unknown as User) };
          } else {
            throw insertErr;
          }
        } else {
          throw insertErr;
        }
      }
    } else {
      // user exist, return user info in db
      user = {
        ...(existUser as unknown as User),
      };
    }

    return user;
  } catch (e) {
    console.log("save user failed: ", e);
    throw e;
  }
}

export async function getUserUuid() {
  let user_uuid = "";

  const token = await getBearerToken();

  if (token) {
    // api key
    if (token.startsWith("sk-")) {
      const user_uuid = await getUserUuidByApiKey(token);

      return user_uuid || "";
    }
  }

  const session = await auth();
  if (session && session.user && session.user.uuid) {
    user_uuid = session.user.uuid;
  }

  return user_uuid;
}

export async function getBearerToken() {
  const h = await headers();
  const auth = h.get("Authorization");
  if (!auth) {
    return "";
  }

  return auth.replace("Bearer ", "");
}

export async function getUserEmail() {
  let user_email = "";

  const session = await auth();
  if (session && session.user && session.user.email) {
    user_email = session.user.email;
  }

  return user_email;
}

export async function getUserInfo() {
  let user_uuid = await getUserUuid();

  if (!user_uuid) {
    return;
  }

  const user = await findUserByUuid(user_uuid);

  return user;
}
