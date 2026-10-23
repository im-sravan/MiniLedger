
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    phone VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_name VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    is_repaid BOOLEAN NOT NULL DEFAULT FALSE,
    repaid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (is_repaid = FALSE AND repaid_at IS NULL)
        OR
        (is_repaid = TRUE AND repaid_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_loans_user_created
    ON loans(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loans_user_due
    ON loans(user_id, due_date)
    WHERE is_repaid = FALSE;
