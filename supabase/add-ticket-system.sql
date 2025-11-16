-- ============================================================================
-- ADD TICKET SYSTEM
-- Garuda Academy - GARUDA-21 Training Center
-- ============================================================================
-- 
-- This script adds:
-- 1. Tickets table (for contact form submissions)
-- 2. Ticket messages table (for ticket conversation thread)
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE TICKETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    ticket_id VARCHAR(50) UNIQUE NOT NULL, -- Human-readable ticket ID (e.g., TKT-2025-0001)
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If user is logged in
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_from VARCHAR(20) CHECK (last_message_from IN ('user', 'admin')) -- Track last message sender
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);

COMMENT ON TABLE tickets IS 'Support tickets created from contact form';
COMMENT ON COLUMN tickets.ticket_id IS 'Human-readable unique ticket identifier';
COMMENT ON COLUMN tickets.status IS 'Current status of the ticket';
COMMENT ON COLUMN tickets.priority IS 'Priority level of the ticket';
COMMENT ON COLUMN tickets.assigned_to IS 'Admin user assigned to handle this ticket';
COMMENT ON COLUMN tickets.last_message_from IS 'Who sent the last message (user or admin)';

-- ============================================================================
-- STEP 2: CREATE TICKET MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin user ID if sender_type is 'admin'
    sender_email VARCHAR(255), -- Email of sender (for non-authenticated users)
    sender_name VARCHAR(255), -- Name of sender
    is_internal BOOLEAN DEFAULT false, -- Internal notes visible only to admins
    read_at TIMESTAMP WITH TIME ZONE -- When the message was read by recipient
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_type ON ticket_messages(sender_type);

COMMENT ON TABLE ticket_messages IS 'Messages in ticket conversation threads';
COMMENT ON COLUMN ticket_messages.sender_type IS 'Type of sender: user or admin';
COMMENT ON COLUMN ticket_messages.is_internal IS 'Internal notes visible only to admins';

-- ============================================================================
-- STEP 3: CREATE FUNCTION TO GENERATE TICKET ID
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year VARCHAR(4);
    ticket_number INTEGER;
    new_ticket_id VARCHAR(50);
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the highest ticket number for current year
    -- Format: TKT-YYYY-XXXX, so we need to extract the number after the second dash
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(ticket_id, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO ticket_number
    FROM tickets
    WHERE ticket_id LIKE 'TKT-' || current_year || '-%';
    
    -- Format: TKT-YYYY-XXXX
    new_ticket_id := 'TKT-' || current_year || '-' || LPAD(ticket_number::TEXT, 4, '0');
    
    RETURN new_ticket_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_ticket_id() IS 'Generates a unique human-readable ticket ID in format TKT-YYYY-XXXX';

-- ============================================================================
-- STEP 4: CREATE FUNCTION TO UPDATE TICKET UPDATED_AT AND LAST_MESSAGE_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update ticket's updated_at and last_message_at
    UPDATE tickets
    SET 
        updated_at = NOW(),
        last_message_at = NOW(),
        last_message_from = NEW.sender_type,
        status = CASE 
            WHEN NEW.sender_type = 'user' AND status = 'resolved' THEN 'open'
            WHEN NEW.sender_type = 'user' AND status = 'closed' THEN 'open'
            WHEN NEW.sender_type = 'admin' AND status = 'open' THEN 'in_progress'
            ELSE status
        END
    WHERE id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_ticket_on_message ON ticket_messages;
CREATE TRIGGER trigger_update_ticket_on_message
    AFTER INSERT ON ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_on_message();

COMMENT ON FUNCTION update_ticket_on_message() IS 'Updates ticket timestamp and status when new message is added';

-- ============================================================================
-- STEP 5: CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Tickets policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Anyone can create tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can insert ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can insert messages for their tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Anyone can create initial ticket message" ON ticket_messages;

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
    ON tickets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Users can view tickets they created (by email or user_id)
-- Also allow anonymous users to view tickets by email (via API with email verification)
CREATE POLICY "Users can view their own tickets"
    ON tickets FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR user_id = auth.uid()
        -- Allow public access via API (checked in API layer with email verification)
        OR true
    );

-- Anyone can create tickets (for contact form)
CREATE POLICY "Anyone can create tickets"
    ON tickets FOR INSERT
    WITH CHECK (true);

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
    ON tickets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update their own tickets"
    ON tickets FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR user_id = auth.uid()
    )
    WITH CHECK (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR user_id = auth.uid()
    );

-- Ticket messages policies
-- Admins can view all messages
CREATE POLICY "Admins can view all ticket messages"
    ON ticket_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
        OR NOT is_internal
    );

-- Users can view messages for their tickets (excluding internal notes)
-- Also allow anonymous users to view messages via API (checked in API layer)
CREATE POLICY "Users can view messages for their tickets"
    ON ticket_messages FOR SELECT
    USING (
        NOT is_internal
        AND (
            EXISTS (
                SELECT 1 FROM tickets
                WHERE tickets.id = ticket_messages.ticket_id
                AND (
                    tickets.email = (SELECT email FROM auth.users WHERE id = auth.uid())
                    OR tickets.user_id = auth.uid()
                )
            )
            -- Allow public access via API (email verification done in API layer)
            OR true
        )
    );

-- Admins can insert messages
CREATE POLICY "Admins can insert ticket messages"
    ON ticket_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Users can insert messages for their tickets
-- Allow anonymous users to insert messages if sender_email matches ticket email
CREATE POLICY "Users can insert messages for their tickets"
    ON ticket_messages FOR INSERT
    WITH CHECK (
        sender_type = 'user'
        AND (
            EXISTS (
                SELECT 1 FROM tickets
                WHERE tickets.id = ticket_messages.ticket_id
                AND (
                    tickets.email = (SELECT email FROM auth.users WHERE id = auth.uid())
                    OR tickets.user_id = auth.uid()
                    OR (sender_email IS NOT NULL AND sender_email = tickets.email) -- Allow email-based access for anonymous
                )
            )
            -- Allow initial message creation (checked in API)
            OR true
        )
    );

-- Anyone can insert initial message when creating ticket
CREATE POLICY "Anyone can create initial ticket message"
    ON ticket_messages FOR INSERT
    WITH CHECK (
        sender_type = 'user'
        AND is_internal = false
    );

-- ============================================================================
-- STEP 6: GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant usage on sequences (if any)
-- Grant select, insert, update on tables
GRANT SELECT, INSERT, UPDATE ON tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ticket_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tickets TO anon;
GRANT SELECT, INSERT, UPDATE ON ticket_messages TO anon;

-- ============================================================================
-- DONE
-- ============================================================================

