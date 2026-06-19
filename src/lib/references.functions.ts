import { createServerFn } from "@tanstack/react-start";

export type RefInput = {
  id: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
};

export type IdStatus = "ok" | "not_found" | "error" | "skipped";

export type RefValidation = {
  id: string;
  doi?: { value: string; status: IdStatus; title?: string; message?: string };
  pmid?: { value: string; status: IdStatus; title?: string; message?: string };
  pmcid?: { value: string; status: IdStatus; message?: string };
  checkedAt: string;
};

async function checkDoi(doi: string): Promise<NonNullable<RefValidation["doi"]>> {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { "User-Agent": "Graftgen-RefValidator/1.0 (mailto:kontakt@graftgen.com)" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return { value: doi, status: "not_found" };
    if (!res.ok) return { value: doi, status: "error", message: `HTTP ${res.status}` };
    const json = (await res.json()) as { message?: { title?: string[] } };
    return { value: doi, status: "ok", title: json.message?.title?.[0] };
  } catch (e) {
    return { value: doi, status: "error", message: (e as Error).message };
  }
}

async function checkPmid(pmid: string): Promise<NonNullable<RefValidation["pmid"]>> {
  try {
    const res = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${encodeURIComponent(pmid)}&retmode=json`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return { value: pmid, status: "error", message: `HTTP ${res.status}` };
    const json = (await res.json()) as { result?: Record<string, { uid?: string; title?: string; error?: string }> };
    const entry = json.result?.[pmid];
    if (!entry || entry.error || !entry.uid) return { value: pmid, status: "not_found" };
    return { value: pmid, status: "ok", title: entry.title };
  } catch (e) {
    return { value: pmid, status: "error", message: (e as Error).message };
  }
}

async function checkPmcid(pmcid: string): Promise<NonNullable<RefValidation["pmcid"]>> {
  const numeric = pmcid.replace(/^PMC/i, "");
  try {
    const res = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${encodeURIComponent(numeric)}&retmode=json`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return { value: pmcid, status: "error", message: `HTTP ${res.status}` };
    const json = (await res.json()) as { result?: Record<string, { uid?: string; error?: string }> };
    const entry = json.result?.[numeric];
    if (!entry || entry.error || !entry.uid) return { value: pmcid, status: "not_found" };
    return { value: pmcid, status: "ok" };
  } catch (e) {
    return { value: pmcid, status: "error", message: (e as Error).message };
  }
}

export const validateReferences = createServerFn({ method: "GET" })
  .inputValidator((input: { refs: RefInput[] }) => input)
  .handler(async ({ data }): Promise<RefValidation[]> => {
    const results = await Promise.all(
      data.refs.map(async (r): Promise<RefValidation> => {
        const [doi, pmid, pmcid] = await Promise.all([
          r.doi ? checkDoi(r.doi) : Promise.resolve(undefined),
          r.pmid ? checkPmid(r.pmid) : Promise.resolve(undefined),
          r.pmcid ? checkPmcid(r.pmcid) : Promise.resolve(undefined),
        ]);
        return { id: r.id, doi, pmid, pmcid, checkedAt: new Date().toISOString() };
      }),
    );
    return results;
  });
