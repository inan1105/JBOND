-- James Bond 초기 스키마 (PRD §4.1)
-- PostgreSQL. 결측은 NULL 로 유지한다(0 대체 금지).

CREATE TABLE IF NOT EXISTS bond_master (
  bond_id        TEXT PRIMARY KEY,
  isin           TEXT,
  issue_code     TEXT,
  bond_name      TEXT NOT NULL,
  category       TEXT NOT NULL,
  bond_type      TEXT NOT NULL,
  issuer_name    TEXT NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'KRW',
  is_subordinated BOOLEAN,
  is_secured      BOOLEAN,
  is_guaranteed   BOOLEAN
);

CREATE TABLE IF NOT EXISTS bond_terms (
  bond_id             TEXT PRIMARY KEY REFERENCES bond_master(bond_id),
  face_value          NUMERIC NOT NULL,
  pricing_face_value  NUMERIC NOT NULL DEFAULT 10000,
  currency            TEXT NOT NULL,
  issue_date          DATE NOT NULL,
  maturity_date       DATE NOT NULL,
  bond_type           TEXT NOT NULL,
  coupon_rate         NUMERIC,          -- 할인채는 NULL
  issue_yield         NUMERIC,
  coupon_frequency    SMALLINT,
  day_count           TEXT NOT NULL,
  redemption_type     TEXT NOT NULL,
  redemption_rate     NUMERIC NOT NULL DEFAULT 100,
  interest_payment_type TEXT NOT NULL,
  CONSTRAINT chk_maturity CHECK (maturity_date > issue_date)
);

CREATE TABLE IF NOT EXISTS bond_cashflows (
  id              BIGSERIAL PRIMARY KEY,
  bond_id         TEXT NOT NULL REFERENCES bond_master(bond_id),
  payment_date    DATE NOT NULL,
  principal       NUMERIC,
  interest        NUMERIC,
  outstanding_face NUMERIC,
  is_estimated    BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_cashflows_bond ON bond_cashflows(bond_id, payment_date);

CREATE TABLE IF NOT EXISTS bond_credit_ratings (
  id          BIGSERIAL PRIMARY KEY,
  bond_id     TEXT NOT NULL REFERENCES bond_master(bond_id),
  agency      TEXT NOT NULL,
  rating      TEXT NOT NULL,
  rated_date  DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS bond_market_prices (
  id               BIGSERIAL PRIMARY KEY,
  bond_id          TEXT NOT NULL REFERENCES bond_master(bond_id),
  valuation_date   DATE NOT NULL,
  yield            NUMERIC,   -- 결측 NULL 유지
  clean_price      NUMERIC,
  dirty_price      NUMERIC,
  accrued_interest NUMERIC,
  trade_volume     NUMERIC,
  trade_amount     NUMERIC,
  value_type       TEXT NOT NULL,
  source           TEXT NOT NULL,
  source_url       TEXT,
  source_timestamp TIMESTAMPTZ,
  collected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  quality_status   TEXT NOT NULL,
  raw_reference    TEXT,
  UNIQUE (bond_id, valuation_date, source, value_type)
);
CREATE INDEX IF NOT EXISTS idx_prices_bond_date ON bond_market_prices(bond_id, valuation_date);

CREATE TABLE IF NOT EXISTS yield_curve_points (
  id             BIGSERIAL PRIMARY KEY,
  curve_id       TEXT NOT NULL,
  category       TEXT NOT NULL,
  credit_rating  TEXT,
  tenor_label    TEXT NOT NULL,
  tenor_years    NUMERIC NOT NULL,
  valuation_date DATE NOT NULL,
  yield          NUMERIC,
  value_type     TEXT NOT NULL,
  quality_status TEXT NOT NULL,
  source         TEXT NOT NULL,
  UNIQUE (curve_id, tenor_label, valuation_date, source)
);
CREATE INDEX IF NOT EXISTS idx_curve ON yield_curve_points(curve_id, valuation_date);

CREATE TABLE IF NOT EXISTS mtm_rates (
  id             BIGSERIAL PRIMARY KEY,
  row_key        TEXT NOT NULL,
  row_label      TEXT NOT NULL,
  tenor_label    TEXT NOT NULL,
  valuation_date DATE NOT NULL,
  yield          NUMERIC,
  change_bp      NUMERIC,
  value_type     TEXT NOT NULL,
  quality_status TEXT NOT NULL,
  source         TEXT NOT NULL,
  UNIQUE (row_key, tenor_label, valuation_date, source)
);

CREATE TABLE IF NOT EXISTS simulation_cases (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT,
  bond_id      TEXT REFERENCES bond_master(bond_id),
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS simulation_results (
  id           BIGSERIAL PRIMARY KEY,
  case_id      BIGINT REFERENCES simulation_cases(id),
  result       JSONB NOT NULL,
  engine_version TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_settings (
  user_id      TEXT PRIMARY KEY,
  tax_rate     NUMERIC NOT NULL,
  tax_base     TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_ingestion_logs (
  id           BIGSERIAL PRIMARY KEY,
  source       TEXT NOT NULL,
  job          TEXT NOT NULL,
  status       TEXT NOT NULL,          -- SUCCESS | ERROR | PARTIAL
  missing_count INT DEFAULT 0,
  latency_ms   INT,
  message      TEXT,
  ran_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_metadata (
  id               BIGSERIAL PRIMARY KEY,
  source           TEXT NOT NULL,
  source_url       TEXT,
  source_timestamp TIMESTAMPTZ,
  collected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  quality_status   TEXT NOT NULL,
  note             TEXT
);
