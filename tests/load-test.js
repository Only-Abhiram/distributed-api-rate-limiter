
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const cacheHits = new Counter("cache_hits");
const cacheMisses = new Counter("cache_misses");

export const options = {
  vus: 50,
  duration: "30s",
};

export default function () {
  const res = http.get("http://localhost:8080/cached-items");

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  if (res.status === 200) {
    const body = res.json();

    if (body.source === "cache") {
      cacheHits.add(1);
    } else if (body.source === "upstream") {
      cacheMisses.add(1);
    }
  }
}
