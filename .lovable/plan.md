

## Diagnosis

After thorough code investigation, I identified **two critical root causes** for buttons not triggering requests on `app.vetagroai.com.br`:

### Root Cause 1: Missing authentication gatekeeper on 5 tool pages

Some tools (AnaliseMucosa, IdentificadorPlantas) correctly check `supabase.auth.getSession()` before calling the backend. But **5 pages skip this check entirely**:

- `DiagnosticoDiferencial.tsx` — uses `invokeEdgeFunction` directly, no auth check
- `CalculadoraDose.tsx` — same
- `Dicionario.tsx` — same
- `Receituario.tsx` — same
- `EscoreCorporal.tsx` — uses `resilientInvoke` but no auth check

Without a session, `supabase.functions.invoke()` sends a request with only the anon key. The edge function returns `401 Authentication required`. However, the Supabase JS client may **swallow the error silently** on some browsers/domains (particularly when CORS preflight interacts with the auth