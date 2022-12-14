import chalk from "chalk";
import {
  GuildMember,
  PermissionFlagsBits,
  PermissionResolvable,
  TextChannel,
} from "discord.js";
import { getFixedT } from "i18next";
import { language as lan, plans } from "./config/config.json";
import { prisma } from "./database/prisma";

type colorType = "text" | "variable" | "error";

const themeColors = {
  text: "#ff8e4d",
  variable: "#ff624d",
  error: "#f5426c",
};

export const getThemeColor = (color: colorType) =>
  Number(`0x${themeColors[color].substring(1)}`);

export const color = (color: colorType, message: any) => {
  return chalk.hex(themeColors[color])(message);
};

export const checkPermissions = (
  member: GuildMember,
  permissions: Array<PermissionResolvable>
) => {
  let neededPermissions: PermissionResolvable[] = [];
  permissions.forEach((permission) => {
    if (!member.permissions.has(permission)) neededPermissions.push(permission);
  });
  if (neededPermissions.length === 0) return null;
  return neededPermissions.map((p) => {
    if (typeof p === "string") return p.split(/(?=[A-Z])/).join(" ");
    else
      return Object.keys(PermissionFlagsBits)
        .find((k) => Object(PermissionFlagsBits)[k] === p)
        ?.split(/(?=[A-Z])/)
        .join(" ");
  });
};

export const sendTimedMessage = (
  message: string,
  channel: TextChannel,
  duration: number
) => {
  channel
    .send(message)
    .then((m) =>
      setTimeout(
        async () => (await channel.messages.fetch(m)).delete(),
        duration
      )
    );
  return;
};

export function language(str: string) {
  const t = getFixedT(lan);
  return t(str);
}

export async function getPlan(member: GuildMember): Promise<any> {
  const user = (await prisma.users.findFirst({
    where: { id: member.user.id },
  })) as { plan: any };
  const index = plans.findIndex((array) => array.name == user?.plan.name);
  if (index != -1) {
    return plans[index];
  }
  return {
    name: user?.plan.name,
    node: "pandora",
    maxApplications: 1,
  };
}

export async function createUser(member: GuildMember): Promise<any> {
  const user = await prisma.users.create({
    data: {
      id: member.user.id,
      tag: member.user.tag,
      blockList: false,
      plan: {
        name: "Free",
        duration: {
          formatted: "7d",
          timer: 100000,
        },
      },
    },
  });
  return user;
}
