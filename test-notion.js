const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function testNotion() {
  console.log("Testing Notion connection...");
  try {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    console.log("SUCCESS! Connected to database:", db.title[0]?.plain_text);
    console.log("Properties available:", Object.keys(db.properties));
  } catch (error) {
    console.error("FAILED to connect to Notion:");
    console.error(error.message);
  }
}

testNotion();
