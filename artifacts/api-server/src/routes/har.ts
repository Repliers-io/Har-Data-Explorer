import { Router, type IRouter } from "express";
import {
  GetHarViewsQueryParams,
  GetHarReviewsQueryParams,
  GetHarShowingsQueryParams,
  GetHarSummaryQueryParams,
} from "@workspace/api-zod";

const REPLIERS_BASE = "https://api.repliers.io";

function getApiKey(): string | null {
  return process.env.REPLIERS_API_KEY ?? null;
}

function buildUrl(
  path: string,
  query: Record<string, string | undefined>,
): string {
  const url = new URL(`${REPLIERS_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function proxyToRepliers(
  url: string,
  apiKey: string,
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(url, {
    headers: {
      "REPLIERS-API-KEY": apiKey,
      Accept: "application/json",
    },
  });
  const data = await response.json();
  return { status: response.status, data };
}

const router: IRouter = Router();

router.get("/har/views", async (req, res): Promise<void> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(401).json({ error: "REPLIERS_API_KEY is not configured" });
    return;
  }

  const parsed = GetHarViewsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mlsNumber, dateBegin, dateEnd, sortBy, limit, offset, boardAgentId } =
    parsed.data;
  const url = buildUrl("/partners/har/listings/views", {
    mlsNumber: mlsNumber?.toString(),
    dateBegin: dateBegin?.toString(),
    dateEnd: dateEnd?.toString(),
    sortBy: sortBy?.toString(),
    limit: limit?.toString(),
    offset: offset?.toString(),
    boardAgentId: boardAgentId?.toString(),
  });

  const { status, data } = await proxyToRepliers(url, apiKey);
  res.status(status).json(data);
});

router.get("/har/reviews", async (req, res): Promise<void> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(401).json({ error: "REPLIERS_API_KEY is not configured" });
    return;
  }

  const parsed = GetHarReviewsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mlsNumber, dateBegin, dateEnd, sortBy, limit, offset, boardAgentId } =
    parsed.data;
  const url = buildUrl("/partners/har/listings/reviews", {
    mlsNumber: mlsNumber?.toString(),
    dateBegin: dateBegin?.toString(),
    dateEnd: dateEnd?.toString(),
    sortBy: sortBy?.toString(),
    limit: limit?.toString(),
    offset: offset?.toString(),
    boardAgentId: boardAgentId?.toString(),
  });

  const { status, data } = await proxyToRepliers(url, apiKey);
  res.status(status).json(data);
});

router.get("/har/showings", async (req, res): Promise<void> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(401).json({ error: "REPLIERS_API_KEY is not configured" });
    return;
  }

  const parsed = GetHarShowingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mlsNumber, dateBegin, dateEnd, sortBy, limit, offset } = parsed.data;
  const url = buildUrl("/partners/har/showingsmart/logs", {
    mlsNumber: mlsNumber?.toString(),
    dateBegin: dateBegin?.toString(),
    dateEnd: dateEnd?.toString(),
    sortBy: sortBy?.toString(),
    limit: limit?.toString(),
    offset: offset?.toString(),
  });

  const { status, data } = await proxyToRepliers(url, apiKey);
  res.status(status).json(data);
});

router.get("/har/summary", async (req, res): Promise<void> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(401).json({ error: "REPLIERS_API_KEY is not configured" });
    return;
  }

  const parsed = GetHarSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { dateBegin, dateEnd } = parsed.data;
  const dateParams = {
    dateBegin: dateBegin?.toString(),
    dateEnd: dateEnd?.toString(),
    limit: "500",
  };

  const [viewsResult, reviewsResult, showingsResult] = await Promise.all([
    proxyToRepliers(
      buildUrl("/partners/har/listings/views", dateParams),
      apiKey,
    ),
    proxyToRepliers(
      buildUrl("/partners/har/listings/reviews", dateParams),
      apiKey,
    ),
    proxyToRepliers(
      buildUrl("/partners/har/showingsmart/logs", dateParams),
      apiKey,
    ),
  ]);

  const firstError = [viewsResult, reviewsResult, showingsResult].find(
    (r) => r.status !== 200,
  );
  if (firstError) {
    res.status(firstError.status).json(firstError.data);
    return;
  }

  const views = viewsResult.data as {
    data: Array<{ webView: number; mobileView: number; mlsNumber: string }>;
    total: number;
  };
  const reviews = reviewsResult.data as {
    data: Array<{ score?: number | null }>;
    total: number;
  };
  const showings = showingsResult.data as {
    data: Array<{ mlsNumber: string; showings?: unknown[] }>;
    total: number;
  };

  const totalWebViews = views.data.reduce(
    (sum, r) => sum + (r.webView ?? 0),
    0,
  );
  const totalMobileViews = views.data.reduce(
    (sum, r) => sum + (r.mobileView ?? 0),
    0,
  );
  const uniqueListingsWithViews = new Set(views.data.map((r) => r.mlsNumber))
    .size;

  const validScores = reviews.data
    .filter((r) => r.score != null)
    .map((r) => r.score as number);
  const averageReviewScore =
    validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : null;

  const totalShowings = showings.total;
  const uniqueListingsWithShowings = new Set(
    showings.data.map((r) => r.mlsNumber),
  ).size;

  res.json({
    totalWebViews,
    totalMobileViews,
    averageReviewScore,
    totalReviews: reviews.total,
    totalShowings,
    uniqueListingsWithViews,
    uniqueListingsWithShowings,
  });
});

export default router;
