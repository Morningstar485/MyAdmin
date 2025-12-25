-- Migration: 11_security_audit.sql
-- Purpose: Verify that RLS is enabled and only strict policies usually exist.
-- Run this and viewing the Results.

WITH table_audit AS (
    SELECT 
        tablename,
        rowsecurity AS rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public'
),
policy_audit AS (
    SELECT 
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual::text AS definition,
        with_check::text AS check_def
    FROM pg_policies 
    WHERE schemaname = 'public'
)
SELECT 
    t.tablename,
    CASE WHEN t.rls_enabled THEN '✅ ON' ELSE '❌ OFF (DANGER)' END as rls_status,
    COUNT(p.policyname) as policy_count,
    CASE 
        -- Check for dangerous "true" policies (allow all)
        WHEN BOOL_OR(p.definition LIKE '%true%' AND p.policyname ILIKE '%public%' OR p.policyname ILIKE '%all%') THEN '❌ INSECURE (Public Access Found)'
        WHEN BOOL_OR(p.definition LIKE '%auth.uid()%') THEN '✅ SECURE (User Restricted)'
        ELSE '⚠️ CHECK MANUALLY'
    END as status_summary
FROM 
    table_audit t
LEFT JOIN 
    policy_audit p ON t.tablename = p.tablename
GROUP BY 
    t.tablename, t.rls_enabled;

-- If you see any '❌' in the result, that is a security risk.
-- If all are '✅', your data is segregated.
