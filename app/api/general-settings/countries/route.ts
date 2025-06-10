import { NextResponse } from "next/server";
import { makeApiRequest, getAuthUsername } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      COMPID: searchParams.get("COMPID") || "PLL",
      pageNumber: searchParams.get("pageNumber") || "1",
      pageSize: searchParams.get("pageSize") || "100",
      CNTYCOD: searchParams.get("CNTYCOD") || "",
      Filter_CNTYCOD: searchParams.get("Filter_CNTYCOD") || "",
      Filter_CNTYDSC: searchParams.get("Filter_CNTYDSC") || "",
      SortField: searchParams.get("sortColumn") || "CNTYCOD",
      SortDirection: searchParams.get("sortDirection") || "ASC",
    };

    return makeApiRequest("country", "GET", {
      params,
      errorMessage: "Failed to fetch countries data",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const username = await getAuthUsername();
    const body = await request.json();

    return makeApiRequest("country", "POST", {
      body: {
        ...body,
        CRTUSR: username,
      },
      errorMessage: "Failed to create country",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const username = await getAuthUsername();
    const body = await request.json();

    return makeApiRequest("country", "PUT", {
      body: {
        ...body,
        CHGUSR: username,
      },
      errorMessage: "Failed to update country",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const compid = searchParams.get("COMPID");
    const cntycod = searchParams.get("CNTYCOD");

    if (!compid || !cntycod) {
      return NextResponse.json(
        { error: "Missing required parameters: COMPID and CNTYCOD" },
        { status: 400 }
      );
    }

    return makeApiRequest("country", "DELETE", {
      params: { COMPID: compid, CNTYCOD: cntycod },
      errorMessage: "Failed to delete country",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(null, { status: 204 });
}
