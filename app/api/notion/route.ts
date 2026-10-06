import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push-server";
import { isSameOrigin } from "@/lib/request-guard";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const databaseId = process.env.NOTION_DATABASE_ID;
  try {
    const { name, desc, mediaUrl } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!databaseId) {
      return NextResponse.json({ error: "Missing Notion Database ID" }, { status: 500 });
    }

    const properties: any = {
      Name: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
      Desc: {
        rich_text: [
          {
            text: {
              content: desc || "",
            },
          },
        ],
      },
    };

    if (mediaUrl) {
      properties["Files & media"] = {
        files: [
          {
            name: "Uploaded Media",
            type: "external",
            external: {
              url: mediaUrl,
            },
          },
        ],
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties,
    });

    await sendPushToAll({
      title: "Laporan baru tersimpan",
      body: name,
      url: "/",
      tag: "new-report",
    }).catch((err) => console.error("Push send error:", err));

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error("Notion API Error:", error);
    return NextResponse.json(
      { error: "Failed to create page in Notion", details: error.message },
      { status: 500 }
    );
  }
}
