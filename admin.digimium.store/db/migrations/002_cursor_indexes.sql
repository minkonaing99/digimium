-- Migration: composite indexes for cursor pagination
-- ORDER BY purchased_date DESC, sale_id DESC in sales_table.php / ws_sales_table.php

CREATE INDEX IF NOT EXISTS idx_cursor_pagination ON sale_overview (purchased_date DESC, sale_id DESC);
CREATE INDEX IF NOT EXISTS idx_cursor_pagination ON ws_sale_overview (purchased_date DESC, sale_id DESC);
