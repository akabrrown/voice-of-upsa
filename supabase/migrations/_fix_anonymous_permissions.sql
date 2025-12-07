-- Grant permissions to service_role and authenticated users

GRANT ALL ON TABLE anonymous_messages TO service_role;
GRANT ALL ON TABLE message_reports TO service_role;

GRANT SELECT, INSERT ON TABLE anonymous_messages TO authenticated;
GRANT SELECT, INSERT ON TABLE message_reports TO authenticated;

-- Explicitly allow service_role to bypass RLS via policy (safeguard)
CREATE POLICY "Service role full access" ON anonymous_messages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access reports" ON message_reports
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
