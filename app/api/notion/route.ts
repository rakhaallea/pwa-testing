import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error("Notion API Error:", error);
    return NextResponse.json(
      { error: "Failed to create page in Notion", details: error.message },
      { status: 500 }
    );
  }
}
