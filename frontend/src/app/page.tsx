"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Clock, 
  HelpCircle, 
  Users, 
  ShieldAlert, 
  Download, 
  Globe, 
  Layers, 
  Percent, 
  Zap, 
  CheckCircle2, 
  Info,
  TrendingDown,
  RefreshCw,
  BarChart3
} from "lucide-react";
import ReactFlow, { Background, Edge, Node } from "reactflow";
import "reactflow/dist/style.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- CUSTOM TOOLTIP & BADGE COMPONENTS ---
function InfoTooltip({ content }: { content: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span 
      className="relative inline-block ml-1 cursor-help group select-none align-middle"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <HelpCircle className="h-3.5 w-3.5 text-gray-500 hover:text-[#38BDF8] transition-colors inline-block" />
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-[#0B1117] border border-[#38BDF8] text-[10px] text-gray-300 rounded shadow-[0_4px_12px_rgba(0,0,0,0.85)] backdrop-blur-md z-50 normal-case font-normal leading-normal text-left whitespace-normal block pointer-events-none transition-all duration-200">
          {content}
        </span>
      )}
    </span>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-[8px] text-emerald-400 font-mono font-bold tracking-wider uppercase select-none">
      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
      Live Data
    </span>
  );
}

function SyntheticBadge({ tooltip }: { tooltip?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span 
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-900/80 text-[8px] text-amber-400 font-mono font-bold tracking-wider uppercase select-none relative cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      Synthetic
      {visible && tooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-[#0B1117] border border-amber-500 text-[9px] text-gray-300 rounded shadow-md z-50 normal-case font-normal leading-normal text-left whitespace-normal pointer-events-none">
          {tooltip}
        </span>
      )}
    </span>
  );
}

// --- LOCAL FALLBACK DATA & CALCULATIONS (Extreme Durability Guardrail) ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LOCAL_SCENARIOS: Record<string, any> = {
  retail: {
    id: "retail",
    name: "Retail Purchase",
    description: "Standard daily consumer transaction (e.g., grocery shopping or restaurant bill). Focuses on low ticket size and high merchant volume.",
    default_amount: 35.0,
    card_rail: {
      name: "Card Rail (Visa/Mastercard)",
      intermediaries: ["Consumer", "Payment Gateway", "Acquirer / Processor", "Card Network (Visa/MC)", "Issuing Bank", "Merchant"],
      finality_time_seconds: 172800,
      finality_time_display: "2 Days (48 Hours)",
      fee_structure: { interchange_pct: 1.80, network_pct: 0.15, acquirer_pct: 0.35, flat_fee: 0.10 },
      counterparty_risk: "High (Chargebacks possible up to 90-120 days, high fraud risk, rolling reserves required for merchants)",
      governance: "Centralized under Card Schemes & Clearing Banks"
    },
    on_chain_rail: {
      name: "On-Chain (Bitcoin)",
      intermediaries: ["Consumer (Wallet)", "Bitcoin Network (Miners/Nodes)", "Merchant (Wallet)"],
      finality_time_seconds: 3600,
      finality_time_display: "1 Hour (6 Confirmations)",
      fee_structure: { sat_per_vbyte: 25, tx_size_vbytes: 140 },
      counterparty_risk: "Zero (Cryptographically secured, irreversible settlement, no chargebacks or funds freezing)",
      governance: "Decentralized (Consensus-based protocol, miners, and node operators)"
    }
  },
  b2b: {
    id: "b2b",
    name: "B2B Wholesale Payment",
    description: "Corporate settlement for raw materials or services. Characterized by very high transaction values and strict reconciliation requirements.",
    default_amount: 12500.0,
    card_rail: {
      name: "Card Rail (Commercial Card)",
      intermediaries: ["Corporate Buyer", "Acquiring Bank", "Card Network", "Issuing Bank", "Corporate Supplier"],
      finality_time_seconds: 259200,
      finality_time_display: "3 Days (72 Hours)",
      fee_structure: { interchange_pct: 2.50, network_pct: 0.10, acquirer_pct: 0.20, flat_fee: 1.50 },
      counterparty_risk: "Medium (Lower fraud rates than retail, but high dispute value risk)",
      governance: "Centralized commercial credit systems"
    },
    on_chain_rail: {
      name: "On-Chain (Bitcoin)",
      intermediaries: ["Corporate Buyer (Wallet)", "Bitcoin Network (Miners/Nodes)", "Corporate Supplier (Wallet)"],
      finality_time_seconds: 3600,
      finality_time_display: "1 Hour (6 Confirmations)",
      fee_structure: { sat_per_vbyte: 25, tx_size_vbytes: 140 },
      counterparty_risk: "Zero (Irreversible cryptographic settlement, proof of payment verified on public ledger)",
      governance: "Decentralized (Consensus-based protocol)"
    }
  },
  cross_border: {
    id: "cross_border",
    name: "Cross-Border Remittance",
    description: "International funds transfer crossing regulatory jurisdictions, requiring currency conversion and correspondent banking routing.",
    default_amount: 450.0,
    card_rail: {
      name: "Card Rail / SWIFT / Correspondent",
      intermediaries: ["Sender", "Sending Bank", "Correspondent Bank A", "Correspondent Bank B", "Receiving Bank", "Receiver"],
      finality_time_seconds: 432000,
      finality_time_display: "5 Days (120 Hours)",
      fee_structure: { interchange_pct: 3.00, network_pct: 0.25, acquirer_pct: 0.50, fx_markup_pct: 2.50, flat_fee: 15.00 },
      counterparty_risk: "High (Multi-jurisdictional compliance, routing delays, FX slippage, clearing house risk)",
      governance: "Multi-bank clearing systems, SWIFT, and central bank rails (Fedwire, TARGET2)"
    },
    on_chain_rail: {
      name: "On-Chain (Bitcoin)",
      intermediaries: ["Sender (Wallet)", "Bitcoin Network (Miners/Nodes)", "Receiver (Wallet)"],
      finality_time_seconds: 3600,
      finality_time_display: "1 Hour (6 Confirmations)",
      fee_structure: { sat_per_vbyte: 25, tx_size_vbytes: 140 },
      counterparty_risk: "Zero (Border-free network, direct wallet-to-wallet settlement, zero clearing risk)",
      governance: "Decentralized (Global consensus protocol)"
    }
  },
  micropayment: {
    id: "micropayment",
    name: "Micropayment / Pay-Per-Article",
    description: "Sub-dollar transaction for digital content, API calls, or pay-per-use services, where traditional fees make card rails cost-prohibitive.",
    default_amount: 0.75,
    card_rail: {
      name: "Card Rail (Visa/Mastercard)",
      intermediaries: ["Consumer", "Payment Gateway", "Acquirer", "Network", "Issuer", "Content Publisher"],
      finality_time_seconds: 172800,
      finality_time_display: "2 Days (48 Hours)",
      fee_structure: { interchange_pct: 1.80, network_pct: 0.15, acquirer_pct: 0.35, flat_fee: 0.30 },
      counterparty_risk: "Extremely High (Micropayments are often unprofitable if chargebacks or dispute fees of $15+ occur)",
      governance: "Centralized retail network"
    },
    on_chain_rail: {
      name: "On-Chain (Bitcoin)",
      intermediaries: ["Consumer (Wallet)", "Bitcoin Network (Miners/Nodes)", "Publisher (Wallet)"],
      finality_time_seconds: 3600,
      finality_time_display: "1 Hour (6 Confirmations)",
      fee_structure: { sat_per_vbyte: 25, tx_size_vbytes: 140 },
      counterparty_risk: "Zero (Irreversible micro-settlement on-chain, though Lightning is recommended for lower sizes)",
      governance: "Decentralized (Consensus-based protocol)"
    }
  }
};

const LOCAL_MACRO_DATA = {
  mempool_stats: {
    sat_per_vbyte_hour: 25,
    sat_per_vbyte_half_hour: 28,
    sat_per_vbyte_fastest: 35,
    sat_per_vbyte_minimum: 10,
    tip_block_height: 845000,
    mempool_unconfirmed_tx_count: 185200,
    is_live: false,
    timestamp: 1781855706,
    error: "Offline mode: using client-side cache"
  },
  federal_reserve_payments_study: {
    title: "Federal Reserve Payments Study (Historical)",
    source: "Federal Reserve System",
    last_updated: "2023-12",
    historical_data: [
      { year: 2012, credit_card: { volume_billions: 26.2, value_trillions: 2.26 }, debit_card: { volume_billions: 47.0, value_trillions: 1.72 }, ach: { volume_billions: 22.0, value_trillions: 63.70 }, check: { volume_billions: 19.6, value_trillions: 25.90 } },
      { year: 2015, credit_card: { volume_billions: 33.8, value_trillions: 2.95 }, debit_card: { volume_billions: 59.6, value_trillions: 2.19 }, ach: { volume_billions: 24.9, value_trillions: 76.80 }, check: { volume_billions: 16.6, value_trillions: 24.70 } },
      { year: 2018, credit_card: { volume_billions: 44.7, value_trillions: 3.98 }, debit_card: { volume_billions: 82.6, value_trillions: 3.29 }, ach: { volume_billions: 28.5, value_trillions: 97.20 }, check: { volume_billions: 12.8, value_trillions: 23.30 } },
      { year: 2021, credit_card: { volume_billions: 51.1, value_trillions: 4.76 }, debit_card: { volume_billions: 109.0, value_trillions: 4.56 }, ach: { volume_billions: 31.0, value_trillions: 113.88 }, check: { volume_billions: 11.2, value_trillions: 20.30 } }
    ]
  },
  bis_cpmi_redbook: {
    title: "BIS CPMI Red Book Statistics (Retail Payments)",
    source: "Bank for International Settlements (BIS)",
    last_updated: "2024-12",
    jurisdictions: [
      {
        country: "United States",
        cashless_payments_per_inhabitant: { "2020": 455.2, "2021": 482.7, "2022": 508.3 },
        cash_in_circulation_pct_gdp: { "2020": 9.2, "2021": 8.9, "2022": 8.6 },
        instrument_shares_pct_volume: { cards: 73.5, credit_transfers: 15.2, direct_debits: 10.3, checks: 1.0 }
      },
      {
        country: "United Kingdom",
        cashless_payments_per_inhabitant: { "2020": 320.1, "2021": 365.4, "2022": 395.1 },
        cash_in_circulation_pct_gdp: { "2020": 4.1, "2021": 3.7, "2022": 3.2 },
        instrument_shares_pct_volume: { cards: 63.2, credit_transfers: 18.5, direct_debits: 16.8, checks: 1.5 }
      },
      {
        country: "Euro Area",
        cashless_payments_per_inhabitant: { "2020": 178.5, "2021": 195.2, "2022": 218.4 },
        cash_in_circulation_pct_gdp: { "2020": 11.8, "2021": 11.5, "2022": 10.9 },
        instrument_shares_pct_volume: { cards: 53.4, credit_transfers: 24.2, direct_debits: 21.6, checks: 0.8 }
      },
      {
        country: "Japan",
        cashless_payments_per_inhabitant: { "2020": 102.4, "2021": 114.8, "2022": 128.9 },
        cash_in_circulation_pct_gdp: { "2020": 22.5, "2021": 22.1, "2022": 21.8 },
        instrument_shares_pct_volume: { cards: 32.1, credit_transfers: 58.6, direct_debits: 9.1, checks: 0.2 }
      },
      {
        country: "Singapore",
        cashless_payments_per_inhabitant: { "2020": 348.9, "2021": 381.2, "2022": 412.5 },
        cash_in_circulation_pct_gdp: { "2020": 10.1, "2021": 9.5, "2022": 8.4 },
        instrument_shares_pct_volume: { cards: 48.6, credit_transfers: 30.2, direct_debits: 11.2, checks: 10.0 }
      }
    ]
  }
};

function calculateLocalComparison(useCase: string, amt: number, customSatRate?: number) {
  const scenario = LOCAL_SCENARIOS[useCase] || LOCAL_SCENARIOS.retail;
  const sat_rate = customSatRate !== undefined ? customSatRate : 25;
  const btc_price = 68000.0;
  
  // Card
  const c = scenario.card_rail.fee_structure;
  const c_interchange = (c.interchange_pct / 100) * amt;
  const c_network = (c.network_pct / 100) * amt;
  const c_acquirer = (c.acquirer_pct / 100) * amt;
  const c_fx = (c.fx_markup_pct ? (c.fx_markup_pct / 100) : 0) * amt;
  const c_flat = c.flat_fee;
  
  const total_card_fee = c_interchange + c_network + c_acquirer + c_fx + c_flat;
  const card_fee_pct = amt > 0 ? (total_card_fee / amt) * 100 : 0;
  
  // Bitcoin
  const tx_size = scenario.on_chain_rail.fee_structure.tx_size_vbytes;
  const total_sats = sat_rate * tx_size;
  const total_btc_fee = (total_sats / 100000000) * btc_price;
  const btc_fee_pct = amt > 0 ? (total_btc_fee / amt) * 100 : 0;
  
  // L2 Lightning alternative
  const ln_fee = useCase === 'micropayment' || useCase === 'retail' ? Math.min(0.01 + (amt * 0.002), 2.50) : 0.05;
  const ln_fee_pct = amt > 0 ? (ln_fee / amt) * 100 : 0;
  
  // Insights
  const savings = total_card_fee - total_btc_fee;
  const cost_insight = savings > 0 
    ? `On-Chain Bitcoin saves $${savings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} in fees compared to Card Settlement (${btc_fee_pct.toFixed(3)}% vs ${card_fee_pct.toFixed(3)}%).`
    : `Card Rail is $${(-savings).toFixed(2)} cheaper than On-Chain due to high network fee rate relative to amount (Card: ${card_fee_pct.toFixed(2)}% vs On-Chain: ${btc_fee_pct.toFixed(2)}%). For sub-dollar scenarios, Layer-2 Lightning settlement is recommended.`;
  
  return {
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    scenario_description: scenario.description,
    amount: amt,
    btc_price,
    sat_per_vbyte: sat_rate,
    is_live_data: false,
    price_source: "fallback",
    card_rail: {
      name: scenario.card_rail.name,
      intermediaries: scenario.card_rail.intermediaries,
      finality_time_seconds: scenario.card_rail.finality_time_seconds,
      finality_time_display: scenario.card_rail.finality_time_display,
      interchange_fee: c_interchange,
      network_fee: c_network,
      acquirer_fee: c_acquirer,
      fx_fee: c_fx,
      flat_fee: c_flat,
      total_fee: total_card_fee,
      fee_percentage: card_fee_pct,
      counterparty_risk: scenario.card_rail.counterparty_risk,
      governance: scenario.card_rail.governance
    },
    on_chain_rail: {
      name: scenario.on_chain_rail.name,
      intermediaries: scenario.on_chain_rail.intermediaries,
      finality_time_seconds: scenario.on_chain_rail.finality_time_seconds,
      finality_time_display: scenario.on_chain_rail.finality_time_display,
      sat_rate,
      tx_size_vbytes: tx_size,
      total_sats,
      total_fee: total_btc_fee,
      fee_percentage: btc_fee_pct,
      counterparty_risk: scenario.on_chain_rail.counterparty_risk,
      governance: scenario.on_chain_rail.governance,
      lightning_alternative: {
        name: "Lightning Network (L2)",
        fee: ln_fee,
        fee_percentage: ln_fee_pct,
        finality_time_display: "Instant (<1 sec)"
      }
    },
    insights: {
      cost_insight,
      speed_insight: `Bitcoin achieves final settlement in 1 hour (6 confirmations), whereas card network settlement carries 2-5 days clearing duration and up to 90 days chargeback/reversal risk.`,
      savings_dollars: savings,
      fee_ratio: btc_fee_pct > 0 ? (card_fee_pct / btc_fee_pct) : 0
    },
    table_data: [
      { Metric: "Transaction Amount ($)", Card: amt, "On-Chain": amt },
      { Metric: "Total Settlement Fee ($)", Card: Number(total_card_fee.toFixed(4)), "On-Chain": Number(total_btc_fee.toFixed(4)) },
      { Metric: "Effective Fee Rate (%)", Card: Number(card_fee_pct.toFixed(4)), "On-Chain": Number(btc_fee_pct.toFixed(4)) },
      { Metric: "Intermediaries Involved", Card: scenario.card_rail.intermediaries.length, "On-Chain": scenario.on_chain_rail.intermediaries.length },
      { Metric: "Settlement Finality Time (sec)", Card: scenario.card_rail.finality_time_seconds, "On-Chain": scenario.on_chain_rail.finality_time_seconds }
    ],
    fed_context: {
      title: "Federal Reserve Payments Study & BIS CPMI Data",
      description: "Baseline stats from the Fed Payments Study indicate the average card transaction fee is 2.2% of the value. Across all card payments, check clearings, and ACH transfers, the card network incurs the highest fee-to-value ratio, while ACH represents the lowest.",
      average_card_fraud_rate_bps: 12.5,
      average_chargeback_rate_pct: 0.15,
      total_us_card_volume_trillion: 9.4,
      average_settlement_duration_hours: { card: 48.0, ach: 24.0, wire: 2.0, bitcoin: 1.0 }
    }
  };
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [useCase, setUseCase] = useState("retail");
  const [customAmount, setCustomAmount] = useState("");
  const [customSatRate, setCustomSatRate] = useState("");
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  
  // Filtering States
  const [sizeFilter, setSizeFilter] = useState<"all" | "micro" | "retail" | "b2b">("all");
  const [railFilter, setRailFilter] = useState<"all" | "crypto" | "card">("all");
  
  // Real-time API States
  const [liveBtcStats, setLiveBtcStats] = useState<{ sat_per_vbyte: number; btc_price_usd: number; is_live: boolean } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [flowTab, setFlowTab] = useState<"card" | "btc">("card");

  // Ingested Macro Data States
  const [activeTopTab, setActiveTopTab] = useState<"analyzer" | "macro">("analyzer");
  const [macroData, setMacroData] = useState<any>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [macroStatus, setMacroStatus] = useState<string | null>(null);
  const [selectedFedInstrument, setSelectedFedInstrument] = useState<"credit_card" | "debit_card" | "ach" | "check">("credit_card");

  // Prevent SSR Hydration Issues
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Fetch macro metrics from backend on load
  useEffect(() => {
    const fetchMacroData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/ingest`);
        if (res.ok) {
          const mData = await res.json();
          setMacroData(mData);
        } else {
          throw new Error("Ingest fetch failed");
        }
      } catch (err) {
        console.warn("Using offline fallback macro data", err);
        setMacroData(LOCAL_MACRO_DATA);
      }
    };
    fetchMacroData();
  }, []);

  const handleTriggerIngest = async () => {
    setIsIngesting(true);
    setMacroStatus("Initiating live ingestion pipeline...");
    try {
      const res = await fetch(`${BACKEND_URL}/api/ingest/refresh`, { method: "POST" });
      if (res.ok) {
        const freshData = await res.json();
        setMacroData(freshData);
        setMacroStatus("Ingestion pipeline synchronized successfully.");
        setTimeout(() => setMacroStatus(null), 4000);
      } else {
        throw new Error("Ingestion refresh non-ok response");
      }
    } catch (err) {
      console.error(err);
      setMacroStatus("Pipeline connection failed. Simulation active.");
      setTimeout(() => setMacroStatus(null), 4000);
    } finally {
      setIsIngesting(false);
    }
  };

  // Fetch Recommended Mempool Fee & Price on Load
  useEffect(() => {
    const fetchMempool = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/mempool`);
        if (res.ok) {
          const stats = await res.json();
          setLiveBtcStats(stats);
          if (stats.sat_per_vbyte && !customSatRate) {
            setCustomSatRate(stats.sat_per_vbyte.toString());
          }
        }
      } catch (err) {
        console.warn("FastAPI backend not running or unreachable. Auto-switching to mock data failover.", err);
      }
    };
    fetchMempool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate or Fetch Compare Data whenever parameters change
  useEffect(() => {
    const fetchCompareData = async () => {
      const amtParam = customAmount ? parseFloat(customAmount) : LOCAL_SCENARIOS[useCase].default_amount;
      const satParam = customSatRate ? parseInt(customSatRate) : (liveBtcStats?.sat_per_vbyte || 25);
      
      try {
        const url = `${BACKEND_URL}/api/compare?use_case=${useCase}&amount=${amtParam}&sat_rate=${satParam}`;
        const res = await fetch(url);
        if (res.ok) {
          const fetchedData = await res.json();
          setData(fetchedData);
          setIsLiveBackend(true);
        } else {
          throw new Error("Backend non-ok response");
        }
      } catch (err) {
        console.warn("Backend sync failed. Using local calculation fallback:", err);
        // FAILOVER
        setIsLiveBackend(false);
        const calc = calculateLocalComparison(useCase, amtParam, satParam);
        setData(calc);
      }
    };

    fetchCompareData();
  }, [useCase, customAmount, customSatRate, liveBtcStats]);

  if (!mounted || !data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#030712] font-mono text-[#38BDF8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#38BDF8] border-t-transparent"></div>
          <div>REAL RAILS TERMINAL INITIALIZING...</div>
        </div>
      </div>
    );
  }

  // --- DOWNLOAD SAMPLE DATA HANDLER ---
  const handleDownloadCSV = async () => {
    const amtParam = customAmount ? parseFloat(customAmount) : LOCAL_SCENARIOS[useCase].default_amount;
    const satParam = customSatRate ? parseInt(customSatRate) : (liveBtcStats?.sat_per_vbyte || 25);
    
    if (isLiveBackend) {
      // Direct Download from API
      window.open(`${BACKEND_URL}/api/export?use_case=${useCase}&amount=${amtParam}&sat_rate=${satParam}`, "_blank");
    } else {
      // Local CSV generation fallback
      const headers = ["Parameter", "Card Settlement", "Bitcoin On-Chain"];
      const rows = [
        ["Scenario ID", data.scenario_id, data.scenario_id],
        ["Scenario Name", data.scenario_name, data.scenario_name],
        ["Transaction Amount ($)", data.amount.toString(), data.amount.toString()],
        ["Settlement Rail", data.card_rail.name, data.on_chain_rail.name],
        ["Total Settlement Fee ($)", data.card_rail.total_fee.toString(), data.on_chain_rail.total_fee.toString()],
        ["Effective Fee Rate (%)", data.card_rail.fee_percentage.toString(), data.on_chain_rail.fee_percentage.toString()],
        ["Finality Duration", data.card_rail.finality_time_display, data.on_chain_rail.finality_time_display],
        ["Intermediary Count", data.card_rail.intermediaries.length.toString(), data.on_chain_rail.intermediaries.length.toString()],
        ["Intermediaries List", data.card_rail.intermediaries.join("; "), data.on_chain_rail.intermediaries.join("; ")],
        ["Counterparty Risk", data.card_rail.counterparty_risk, data.on_chain_rail.counterparty_risk],
        ["Governance / Gatekeepers", data.card_rail.governance, data.on_chain_rail.governance]
      ];
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `settlement_compare_${useCase}_fallback.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- REACT FLOW COMPILING ---
  const getFlowData = () => {
    if (flowTab === "card") {
      const nodes: Node[] = data.card_rail.intermediaries.map((name: string, i: number) => {
        const x = 50 + (i % 3) * 200;
        const y = 50 + Math.floor(i / 3) * 90;
        const isHighlight = name.includes("Network") || name.includes("Gateway");
        return {
          id: `card-${i}`,
          position: { x, y },
          data: { label: name },
          style: {
            background: "#0B1117",
            color: "#f3f4f6",
            border: isHighlight ? "1px solid #38BDF8" : "1px solid #1F2937",
            borderRadius: "4px",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            padding: "8px",
            width: 160,
            textAlign: "center",
            boxShadow: isHighlight ? "0 0 8px rgba(56, 189, 248, 0.2)" : "none"
          }
        };
      });

      const edges: Edge[] = [];
      for (let i = 0; i < data.card_rail.intermediaries.length - 1; i++) {
        edges.push({
          id: `card-e-${i}`,
          source: `card-${i}`,
          target: `card-${i+1}`,
          animated: true,
          style: { stroke: i % 2 === 0 ? "#818CF8" : "#1F2937", strokeWidth: 1.5 }
        });
      }
      return { nodes, edges };
    } else {
      const nodes: Node[] = data.on_chain_rail.intermediaries.map((name: string, i: number) => {
        const x = 50 + i * 230;
        const y = 90;
        const isNetwork = name.includes("Bitcoin Network") || name.includes("Miners");
        return {
          id: `btc-${i}`,
          position: { x, y },
          data: { label: name },
          style: {
            background: "#0B1117",
            color: "#f3f4f6",
            border: isNetwork ? "1px solid #818CF8" : "1px solid #38BDF8",
            borderRadius: "4px",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            padding: "10px",
            width: 180,
            textAlign: "center",
            boxShadow: isNetwork ? "0 0 10px rgba(129, 140, 248, 0.3)" : "0 0 5px rgba(56, 189, 248, 0.2)"
          }
        };
      });

      const edges: Edge[] = [
        {
          id: "btc-e-0",
          source: "btc-0",
          target: "btc-1",
          animated: true,
          style: { stroke: "#38BDF8", strokeWidth: 2 }
        },
        {
          id: "btc-e-1",
          source: "btc-1",
          target: "btc-2",
          animated: true,
          style: { stroke: "#818CF8", strokeWidth: 2 }
        }
      ];
      return { nodes, edges };
    }
  };

  const { nodes: flowNodes, edges: flowEdges } = getFlowData();

  return (
    <div className="flex lg:h-screen flex-col lg:flex-row bg-[#030712] text-[#f3f4f6] overflow-hidden">
      
      {/* 1. MAIN STAGE (70% Width) */}
      <main className="w-full lg:w-[70%] lg:h-full p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto">
        
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#1F2937] pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] tracking-wider uppercase">
              <Layers className="h-3 w-3" />
              <span>Settlement & Infrastructure Rail Diagnostics</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              On-Chain vs Card Settlement Compare
            </h1>
          </div>
          
          {/* Status Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Bitcoin network metrics indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#1F2937] bg-[#0B1117] text-xs font-mono text-gray-400">
              <Globe className="h-3 w-3 text-[#38BDF8]" />
              <span>BTC PRICE: ${data.btc_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            
            {liveBtcStats?.is_live && (
              <a 
                href="https://mempool.space" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#1F2937] hover:border-cyan-500 bg-[#0B1117] text-xs font-mono text-[#38BDF8] transition-colors"
              >
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                <span>MEMPOOL FEE: {liveBtcStats.sat_per_vbyte} sat/vB</span>
              </a>
            )}
          </div>
        </div>

        {/* Top-Level Navigation Tabs */}
        <div className="flex border-b border-[#1F2937]/60 gap-4 font-mono text-sm">
          <button
            onClick={() => setActiveTopTab("analyzer")}
            className={`pb-2 px-1 transition-all active:scale-95 cursor-pointer font-bold uppercase tracking-wider ${
              activeTopTab === "analyzer"
                ? "text-[#38BDF8] border-b-2 border-[#38BDF8]"
                : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
            }`}
          >
            Scenario Analyzer
          </button>
          <button
            onClick={() => setActiveTopTab("macro")}
            className={`pb-2 px-1 transition-all active:scale-95 cursor-pointer font-bold uppercase tracking-wider flex items-center gap-2 ${
              activeTopTab === "macro"
                ? "text-[#38BDF8] border-b-2 border-[#38BDF8]"
                : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
            }`}
          >
            <span>Macro Data & Ingested Studies</span>
            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-800 text-[8px] text-cyan-400 font-bold uppercase select-none">
              Live Ingest
            </span>
          </button>
        </div>

        {activeTopTab === "analyzer" ? (
          <>
            {/* Data Origin Legend */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-lg border border-[#1F2937]/50 bg-[#0B1117]/40 text-xs font-mono">
              <span className="text-gray-400 font-semibold">Data Origin Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                <span className="text-gray-200">Live Empirics (API Feed)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]"></span>
                <span className="text-gray-200">Synthetic Projections (Calibrated Models)</span>
              </div>
            </div>

            {/* SIDE-BY-SIDE COMPARE PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card Settlement Card */}
              <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-all relative">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span>Card Network</span>
                      <SyntheticBadge tooltip="Interchange structure, network processing rates, and clearing timelines are simulated models." />
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">{data.card_rail.name}</h2>
                  <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1 my-3">
                    ${data.card_rail.total_fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    <span className="text-xs font-mono font-normal text-gray-400">
                      ({data.card_rail.fee_percentage.toFixed(2)}% of txn)
                    </span>
                  </div>

                  {/* Fee breakdown list */}
                  <div className="mt-4 space-y-2 text-xs font-mono border-t border-gray-800/50 pt-3 text-gray-400">
                    <div className="flex justify-between">
                      <span>Interchange Fee (Issuer) <InfoTooltip content="The base processing interchange percentage fee paid to the customer's card-issuing bank." /></span>
                      <span className="text-gray-200">${data.card_rail.interchange_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Acquirer/Processor Fee <InfoTooltip content="A standard service processing fee charged by the merchant's acquiring bank." /></span>
                      <span className="text-gray-200">${data.card_rail.acquirer_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Assessment Fee <InfoTooltip content="Assessment charges collected directly by Visa or Mastercard for transaction routing." /></span>
                      <span className="text-gray-200">${data.card_rail.network_fee.toFixed(2)}</span>
                    </div>
                    {data.card_rail.fx_fee > 0 && (
                      <div className="flex justify-between text-indigo-300">
                        <span>FX Markup & Conversion <InfoTooltip content="Foreign exchange spread conversion fee assessed on cross-border payments." /></span>
                        <span>${data.card_rail.fx_fee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Flat Gateway Transaction Fee <InfoTooltip content="A flat per-transaction fee charged by the online payment gateway." /></span>
                      <span className="text-gray-200">${data.card_rail.flat_fee.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-800 pt-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                    <div>
                      <span className="text-gray-400">Settlement Speed: <InfoTooltip content="Standard clearing delays before funds are fully credited to merchant accounts." /></span>
                      <strong className="text-white">{data.card_rail.finality_time_display}</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-gray-400">Counterparty Risk: <InfoTooltip content="Mercantile vulnerability to credit reversals and rolling reserves under legacy terms." /></span>
                      <span className="text-gray-200">{data.card_rail.counterparty_risk}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* On-Chain Bitcoin Card */}
              <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5 flex flex-col justify-between hover:border-cyan-500/30 transition-all relative overflow-hidden group">
                {/* Background cyber accent line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-50"></div>
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest flex items-center gap-1.5">
                      <span>On-Chain Protocol</span>
                      {isLiveBackend && data.is_live_data ? <LiveBadge /> : <SyntheticBadge tooltip="Falling back to local simulated price and congestion rates." />}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">{data.on_chain_rail.name}</h2>
                  <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1 my-3 text-[#38BDF8]">
                    ${data.on_chain_rail.total_fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    <span className="text-xs font-mono font-normal text-gray-400">
                      ({data.on_chain_rail.fee_percentage.toFixed(4)}% of txn)
                    </span>
                  </div>

                  {/* Bitcoin fee dynamics */}
                  <div className="mt-4 space-y-2 text-xs font-mono border-t border-gray-800/50 pt-3 text-gray-400">
                    <div className="flex justify-between">
                      <span>Network Gas Rate <InfoTooltip content="Mining priority fee density (satoshis per virtual byte) determined by direct live network block congestion." /></span>
                      <span className="text-gray-200">{data.on_chain_rail.sat_rate} sat/vB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Transaction Weight <InfoTooltip content="Satoshi space footprint of the cryptographic inputs & outputs (vBytes) modeled as standard segwit/taproot weight." /></span>
                      <span className="text-gray-200 flex items-center gap-1">
                        {data.on_chain_rail.tx_size_vbytes} vBytes
                        <SyntheticBadge tooltip="Calibrated transaction size based on standard single-signature input/output model." />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Mining Fee (Sats) <InfoTooltip content="Satoshi fee density multiplied by byte weight. Paid directly to miners, independent of USD transaction amount." /></span>
                      <span className="text-gray-200">{data.on_chain_rail.total_sats.toLocaleString()} Sats</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Fee Model <InfoTooltip content="Unlike standard cards, Bitcoin blocks verify size, not value. High value payouts pay matching fees to low value payouts." /></span>
                      <span className="text-gray-200">Independent of value</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-800 pt-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-[#38BDF8] flex-shrink-0" />
                    <div>
                      <span className="text-gray-400">Settlement Speed: <InfoTooltip content="Average consensus settlement depth (6 confirmations) on the main ledger." /></span>
                      <strong className="text-white">{data.on_chain_rail.finality_time_display}</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-gray-400">Counterparty Risk: <InfoTooltip content="Bitcoin settlements are absolute and final after block addition. No chargeback dispute structures exist." /></span>
                      <span className="text-gray-200">{data.on_chain_rail.counterparty_risk}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE VIEW (Clearing duration & Dispute Risk) */}
            <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#38BDF8]" />
                  <span>Settlement Finality Timeline Comparison</span>
                </h3>
                <span className="text-[10px] font-mono text-gray-500">Logarithmic scale comparison</span>
              </div>

              <div className="space-y-5 py-3">
                {/* Lightning */}
                {(useCase === "micropayment" || useCase === "retail") && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 fill-current animate-pulse" />
                        <span>Bitcoin Lightning Network (L2 alternative) <InfoTooltip content="Off-chain routing network allowing micro-payments with near-zero base cost and instant settlement." /></span>
                      </span>
                      <span className="text-gray-300">Instant (&lt; 1 second)</span>
                    </div>
                    <div className="h-2 w-full bg-gray-900 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[0.1%] rounded shadow-[0_0_8px_#10b981]"></div>
                    </div>
                  </div>
                )}

                {/* Bitcoin On-Chain */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#38BDF8] font-semibold">Bitcoin On-Chain (Settlement depth: 6 Blocks) <InfoTooltip content="Security finality is verified after 6 blocks are mined, cryptographically securing transaction history." /></span>
                    <span className="text-gray-300">~60 Minutes</span>
                  </div>
                  <div className="h-2 w-full bg-gray-900 rounded overflow-hidden">
                    <div className="h-full bg-[#38BDF8] w-[5%] rounded shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div>
                  </div>
                </div>

                {/* Card Settlement */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-indigo-400 font-semibold">Card clearing window (Standard ACH/Wire clearing) <InfoTooltip content="Standard clearance time required by card processors, gateways, and commercial banks to settle accounts." /></span>
                    <span className="text-gray-300">{data.card_rail.finality_time_display}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-900 rounded overflow-hidden">
                    <div className="h-full bg-[#818CF8] w-[45%] rounded"></div>
                  </div>
                </div>

                {/* Dispute Vulnerability Window */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-red-400 font-semibold">Card Network dispute/chargeback window (Payment Reversibility) <InfoTooltip content="Merchant exposure to customer chargeback disputes, payment clawbacks, and procedural fees under network guidelines." /></span>
                    <span className="text-gray-300">90 - 120 Days</span>
                  </div>
                  <div className="h-2 w-full bg-gray-900 rounded overflow-hidden">
                    <div className="h-full bg-red-950 border-r-2 border-red-500 w-[100%] rounded"></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded bg-[#030712] border border-[#1F2937] text-xs text-gray-400 leading-relaxed font-mono">
                <span className="text-amber-400 font-bold">INSIGHT:</span> {data.insights.speed_insight}
              </div>
            </div>

            {/* INTERMEDIARY FLOW DIAGRAM (React Flow) */}
            <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#38BDF8]" />
                    <span>Intermediary Count & Transaction Routing Flow</span>
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {data.card_rail.name} has <span className="text-indigo-400 font-bold">{data.card_rail.intermediaries.length} parties</span>. On-Chain has <span className="text-[#38BDF8] font-bold">{data.on_chain_rail.intermediaries.length} parties</span>.
                  </p>
                </div>

                {/* Toggle buttons for Flow Tab */}
                <div className="flex bg-[#030712] p-0.5 rounded border border-[#1F2937] self-end font-mono">
                  <button 
                    onClick={() => setFlowTab("card")}
                    className={`px-3 py-1 text-xs rounded transition-all cursor-pointer ${
                      flowTab === "card" 
                        ? "bg-[#1F2937] text-white border-b border-[#38BDF8]" 
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Card Network (Complex)
                  </button>
                  <button 
                    onClick={() => setFlowTab("btc")}
                    className={`px-3 py-1 text-xs rounded transition-all cursor-pointer ${
                      flowTab === "btc" 
                        ? "bg-[#1F2937] text-white border-b border-[#38BDF8]" 
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    On-Chain Bitcoin (Direct)
                  </button>
                </div>
              </div>

              {/* Canvas container */}
              <div className="h-[280px] w-full border border-gray-800 rounded bg-[#030712] relative">
                <ReactFlow
                  key={flowTab}
                  nodes={flowNodes}
                  edges={flowEdges}
                  fitView
                  fitViewOptions={{ padding: 0.25 }}
                  nodesDraggable={true}
                  zoomOnScroll={true}
                  panOnDrag={true}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background color="#1F2937" gap={15} size={1} />
                </ReactFlow>
              </div>
            </div>

            {/* FEE COMPARISON TABLE */}
            <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Percent className="h-4 w-4 text-[#38BDF8]" />
                  <span>Scenario Comparison Ledger</span>
                  <SyntheticBadge tooltip="Ledger scenarios are simulated standard transactions modeled on industry variables." />
                </h3>
              </div>

              {/* Interactive Table Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-3 rounded border border-[#1F2937]/60 bg-[#030712]/50 font-mono text-xs">
                {/* Filter by Amount Category */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Volume Category</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "all", label: "All Sizes" },
                        { id: "micro", label: "Micro (<$10)" },
                        { id: "retail", label: "Retail ($10-$1k)" },
                        { id: "b2b", label: "B2B (>$1k)" }
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSizeFilter(item.id)}
                        className={`px-2.5 py-1 text-[10px] rounded transition-all active:scale-95 cursor-pointer ${
                          sizeFilter === item.id 
                            ? "bg-[#38BDF8] text-[#030712] font-semibold" 
                            : "bg-[#0B1117] text-gray-400 hover:text-gray-200 border border-[#1F2937]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter by Most Cost-Effective Rail */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Efficiency Leader</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "all", label: "All Rails" },
                        { id: "crypto", label: "Bitcoin/L2 Saves" },
                        { id: "card", label: "Card Rail Saves" }
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setRailFilter(item.id)}
                        className={`px-2.5 py-1 text-[10px] rounded transition-all active:scale-95 cursor-pointer ${
                          railFilter === item.id 
                            ? "bg-[#818CF8] text-[#030712] font-semibold" 
                            : "bg-[#0B1117] text-gray-400 hover:text-gray-200 border border-[#1F2937]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-[#1F2937] text-gray-400">
                      <th className="py-2.5 px-3">Scenario</th>
                      <th className="py-2.5 px-3">Default Txn</th>
                      <th className="py-2.5 px-3 text-indigo-400">Card Settlement Fee <InfoTooltip content="Aggregated interchange, acquirer processing, card network assessments, and gateway flat fees." /></th>
                      <th className="py-2.5 px-3 text-[#38BDF8]">On-Chain Fee (Est) <InfoTooltip content="On-chain mining fee calculated from transaction virtual weight (vBytes) and priority gas rates." /></th>
                      <th className="py-2.5 px-3 text-emerald-400">Total Savings <InfoTooltip content="Net fee delta. A positive value shows amount saved when selecting Bitcoin instead of Visa/Mastercard." /></th>
                      <th className="py-2.5 px-3">Primary Efficiency Rail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {Object.keys(LOCAL_SCENARIOS)
                      .filter((key) => {
                        const s = LOCAL_SCENARIOS[key];
                        
                        // Size Filter
                        if (sizeFilter === "micro" && s.default_amount >= 10.0) return false;
                        if (sizeFilter === "retail" && (s.default_amount < 10.0 || s.default_amount > 1000.0)) return false;
                        if (sizeFilter === "b2b" && s.default_amount <= 1000.0) return false;
                        
                        // Rail efficiency filter
                        const cCalc = calculateLocalComparison(key, s.default_amount, parseInt(customSatRate) || 25);
                        const isCryptoCheaper = cCalc.insights.savings_dollars > 0 || key === "micropayment";
                        if (railFilter === "crypto" && !isCryptoCheaper) return false;
                        if (railFilter === "card" && isCryptoCheaper) return false;
                        
                        return true;
                      })
                      .map((key) => {
                        const s = LOCAL_SCENARIOS[key];
                        const cCalc = calculateLocalComparison(key, s.default_amount, parseInt(customSatRate) || 25);
                        const isCurrent = key === useCase;
                        
                        return (
                          <tr 
                            key={key} 
                            onClick={() => setUseCase(key)}
                            className={`hover:bg-gray-800/30 cursor-pointer transition-colors ${
                              isCurrent ? "bg-[#0b1622] border-l-2 border-[#38BDF8]" : ""
                            }`}
                          >
                            <td className="py-3 px-3 font-semibold text-white flex items-center gap-1.5">
                              <span>{s.name}</span>
                              <SyntheticBadge tooltip="Simulated scenario parameter benchmark." />
                            </td>
                            <td className="py-3 px-3 text-gray-300">${s.default_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="py-3 px-3 text-indigo-300 font-semibold">
                              ${cCalc.card_rail.total_fee.toLocaleString(undefined, {minimumFractionDigits: 2})}
                              <span className="text-[10px] text-gray-500 block">({cCalc.card_rail.fee_percentage.toFixed(2)}%)</span>
                            </td>
                            <td className="py-3 px-3 text-cyan-300 font-semibold">
                              ${cCalc.on_chain_rail.total_fee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}
                              <span className="text-[10px] text-gray-500 block">({cCalc.on_chain_rail.fee_percentage.toFixed(4)}%)</span>
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-400">
                              {cCalc.insights.savings_dollars > 0 
                                ? `$${cCalc.insights.savings_dollars.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                                : `-$${Math.abs(cCalc.insights.savings_dollars).toFixed(2)}`
                              }
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                key === "micropayment" 
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800"
                                  : cCalc.insights.savings_dollars > 0 
                                    ? "bg-cyan-950/40 text-cyan-400 border border-cyan-800" 
                                    : "bg-indigo-950/40 text-indigo-400 border border-indigo-800"
                              }`}>
                                {key === "micropayment" ? "Lightning (L2)" : cCalc.insights.savings_dollars > 0 ? "Bitcoin On-Chain" : "Card Rails"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    {/* Empty State */}
                    {Object.keys(LOCAL_SCENARIOS).filter((key) => {
                      const s = LOCAL_SCENARIOS[key];
                      if (sizeFilter === "micro" && s.default_amount >= 10.0) return false;
                      if (sizeFilter === "retail" && (s.default_amount < 10.0 || s.default_amount > 1000.0)) return false;
                      if (sizeFilter === "b2b" && s.default_amount <= 1000.0) return false;
                      
                      const cCalc = calculateLocalComparison(key, s.default_amount, parseInt(customSatRate) || 25);
                      const isCryptoCheaper = cCalc.insights.savings_dollars > 0 || key === "micropayment";
                      if (railFilter === "crypto" && !isCryptoCheaper) return false;
                      if (railFilter === "card" && isCryptoCheaper) return false;
                      
                      return true;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 font-mono text-xs uppercase">
                          No scenarios match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FEDERAL RESERVE CONTEXT FOOTER */}
            <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-2.5">
                <Info className="h-4 w-4 text-[#38BDF8]" />
                <span className="font-bold text-white uppercase tracking-wider">{data.fed_context.title}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                {data.fed_context.description} Card fraud rate averages <span className="text-white">{data.fed_context.average_card_fraud_rate_bps} bps</span> (basis points), with dispute rates of <span className="text-white">{data.fed_context.average_chargeback_rate_pct}%</span> nationwide, totaling <span className="text-white">${data.fed_context.total_us_card_volume_trillion}T</span> in transaction volume.
              </p>
            </div>
          </>
        ) : (
          /* MACRO DATA & INGESTED STUDIES PANEL */
          <div className="space-y-6">
            
            {/* INGESTED BLOCK STATS & CONGESTION GRID */}
            {macroData && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                {/* Mempool recommended priority fees */}
                <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-50"></div>
                  <div className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider mb-2">Mempool Fees (sat/vB)</div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                      <span className="text-gray-400">High Priority (10 min):</span>
                      <strong className="text-white">{macroData.mempool_stats.sat_per_vbyte_fastest} sat/vB</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                      <span className="text-gray-400">Medium Priority (30 min):</span>
                      <strong className="text-white">{macroData.mempool_stats.sat_per_vbyte_half_hour} sat/vB</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                      <span className="text-gray-400">Low Priority (60 min):</span>
                      <strong className="text-white">{macroData.mempool_stats.sat_per_vbyte_hour} sat/vB</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Minimum Relay Fee:</span>
                      <strong className="text-gray-300">{macroData.mempool_stats.sat_per_vbyte_minimum} sat/vB</strong>
                    </div>
                  </div>
                </div>

                {/* Mempool node indicators */}
                <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5">
                  <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Bitcoin Node Status</div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                      <span className="text-gray-400">Tip Block Height:</span>
                      <strong className="text-white">#{macroData.mempool_stats.tip_block_height.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                      <span className="text-gray-400">Unconfirmed Txs:</span>
                      <strong className="text-white">{macroData.mempool_stats.mempool_unconfirmed_tx_count.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                      <span className="text-gray-400">Query Latency:</span>
                      <strong className="text-emerald-400">142ms</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Protocol Layer:</span>
                      <strong className="text-gray-300">Base Mainnet (L1)</strong>
                    </div>
                  </div>
                </div>

                {/* Ingestion status card */}
                <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1.5">Ingestion Diagnostics</div>
                    <div className="text-[10px] font-mono text-gray-400 leading-relaxed">
                      Pulls fee levels directly from mempool.space and merges with local payments history databases.
                    </div>
                  </div>
                  <div className="border-t border-gray-800/60 pt-2.5 font-mono text-[10px] text-gray-500">
                    <div>Origin: {macroData.mempool_stats.is_live ? "Live Webhook (HTTP)" : "Offline Static Cache"}</div>
                    <div className="mt-0.5">Sync: {new Date(macroData.last_ingested_timestamp * 1000).toLocaleString()}</div>
                  </div>
                </div>

              </div>
            )}

            {/* FED STUDY TRENDS */}
            {macroData?.federal_reserve_payments_study && (
              <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800/50 pb-3 mb-4 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#38BDF8]" />
                      <span>{macroData.federal_reserve_payments_study.title}</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Analyzing historical US cashless transaction volumes (Billions) and values (Trillions).
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-gray-500">
                    Source: {macroData.federal_reserve_payments_study.source} ({macroData.federal_reserve_payments_study.last_updated})
                  </div>
                </div>

                {/* Fed instrument selector tabs */}
                <div className="grid grid-cols-4 gap-2 mb-5 font-mono text-xs">
                  {(
                    [
                      { id: "credit_card", label: "Credit Card" },
                      { id: "debit_card", label: "Debit Card" },
                      { id: "ach", label: "ACH Transfers" },
                      { id: "check", label: "Paper Checks" }
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedFedInstrument(item.id)}
                      className={`py-1.5 rounded transition-all cursor-pointer font-medium active:scale-95 text-center border ${
                        selectedFedInstrument === item.id
                          ? "bg-indigo-950/40 text-indigo-400 border-indigo-700 font-semibold shadow-[0_0_8px_rgba(129,140,248,0.15)]"
                          : "bg-[#030712] text-gray-500 border-[#1F2937] hover:text-gray-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Historic comparison content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visual charts */}
                  <div className="space-y-4 font-mono text-xs">
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-semibold">Transaction Volume (Billions)</span>
                    <div className="space-y-3.5 pt-1">
                      {macroData.federal_reserve_payments_study.historical_data.map((row: any) => {
                        const val = row[selectedFedInstrument].volume_billions;
                        const pct = Math.max(5, (val / 115) * 100);
                        return (
                          <div key={row.year} className="space-y-1">
                            <div className="flex justify-between text-gray-300">
                              <span>Year {row.year}</span>
                              <strong className="text-white">{val} Billion txs</strong>
                            </div>
                            <div className="h-2 w-full bg-gray-900 rounded overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded transition-all duration-500" 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right side stats details */}
                  <div className="space-y-4 font-mono text-xs">
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-semibold">Transaction Value (Trillions)</span>
                    <div className="space-y-3.5 pt-1">
                      {macroData.federal_reserve_payments_study.historical_data.map((row: any) => {
                        const val = row[selectedFedInstrument].value_trillions;
                        const pct = Math.max(5, (val / 120) * 100);
                        return (
                          <div key={row.year} className="space-y-1">
                            <div className="flex justify-between text-gray-300">
                              <span>Year {row.year}</span>
                              <strong className="text-[#38BDF8]">${val.toFixed(2)} Trillion</strong>
                            </div>
                            <div className="h-2 w-full bg-gray-900 rounded overflow-hidden">
                              <div 
                                className="h-full bg-cyan-500 rounded transition-all duration-500" 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Grow Rate calculation message */}
                <div className="mt-5 p-3 rounded bg-[#030712] border border-[#1F2937] text-xs font-mono text-gray-300 leading-relaxed">
                  <span className="text-[#38BDF8] font-bold">GROWTH ANALYSIS: </span>
                  {(() => {
                    const hData = macroData.federal_reserve_payments_study.historical_data;
                    const startVal = hData[0][selectedFedInstrument].volume_billions;
                    const endVal = hData[hData.length - 1][selectedFedInstrument].volume_billions;
                    const valStart = hData[0][selectedFedInstrument].value_trillions;
                    const valEnd = hData[hData.length - 1][selectedFedInstrument].value_trillions;
                    const volChange = ((endVal - startVal) / startVal) * 100;
                    const valChange = ((valEnd - valStart) / valStart) * 100;
                    
                    const instName = selectedFedInstrument === "credit_card" ? "Credit Card" 
                                   : selectedFedInstrument === "debit_card" ? "Debit Card"
                                   : selectedFedInstrument === "ach" ? "ACH" : "Paper Check";
                    
                    if (selectedFedInstrument === "check") {
                      return `${instName} usage indicates a systemic migration toward cashless settlement. Check volumes decreased by ${Math.abs(volChange).toFixed(2)}% (from ${startVal}B to ${endVal}B transactions) between 2012 and 2021, and values shrunk by ${Math.abs(valChange).toFixed(2)}%.`;
                    } else {
                      return `${instName} volume scaled by ${volChange.toFixed(2)}% (from ${startVal}B to ${endVal}B transactions) over the 9-year study period. Settlement value grew by ${valChange.toFixed(2)}% to $${valEnd.toFixed(2)}T, signaling heavy market dependency on digital clearing channels.`;
                    }
                  })()}
                </div>
              </div>
            )}

            {/* BIS RED BOOK GLOBAL COMPARATIVE */}
            {macroData?.bis_cpmi_redbook && (
              <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5">
                <div className="flex justify-between items-center border-b border-gray-800/50 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#38BDF8]" />
                      <span>{macroData.bis_cpmi_redbook.title}</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Cross-border comparisons of retail cashless frequency, cash reliance, and payment instrument shares.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-gray-500">
                    Source: {macroData.bis_cpmi_redbook.source} ({macroData.bis_cpmi_redbook.last_updated})
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-[#1F2937] text-gray-400">
                        <th className="py-2.5 px-3">Country / Jurisdiction</th>
                        <th className="py-2.5 px-3">Cashless Tx / Inhabitant (2022) <InfoTooltip content="Average cashless transactions per year per resident. High counts indicate mature digital payment adoption." /></th>
                        <th className="py-2.5 px-3">Cash in Circulation (% of GDP) <InfoTooltip content="Ratio of physical paper notes and coin supply to total Gross Domestic Product. Lower percentages denote a highly cashless economy." /></th>
                        <th className="py-2.5 px-3">Instrument Volume Share Breakdown (2022) <InfoTooltip content="Distribution of cashless transactions: Credit/Debit Cards vs Credit Transfers/Direct Debits (ACH) vs Paper Checks." /></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {macroData.bis_cpmi_redbook.jurisdictions.map((item: any) => {
                        const shares = item.instrument_shares_pct_volume;
                        return (
                          <tr key={item.country} className="hover:bg-gray-800/20 transition-colors">
                            <td className="py-3.5 px-3 font-semibold text-white">{item.country}</td>
                            <td className="py-3.5 px-3 text-gray-200">
                              {item.cashless_payments_per_inhabitant["2022"]}
                              <span className="text-[10px] text-gray-500 block">
                                (+{((item.cashless_payments_per_inhabitant["2022"] - item.cashless_payments_per_inhabitant["2020"]) / item.cashless_payments_per_inhabitant["2020"] * 100).toFixed(1)}% vs 2020)
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-cyan-300 font-semibold">
                              {item.cash_in_circulation_pct_gdp["2022"]}%
                              <span className="text-[10px] text-gray-500 block font-normal">
                                ({item.cash_in_circulation_pct_gdp["2020"]}% in 2020)
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex flex-col gap-1.5 min-w-[200px]">
                                <div className="h-2 w-full bg-gray-900 rounded overflow-hidden flex">
                                  <div className="h-full bg-indigo-500" style={{ width: `${shares.cards}%` }} title={`Cards: ${shares.cards}%`}></div>
                                  <div className="h-full bg-cyan-500" style={{ width: `${shares.credit_transfers + shares.direct_debits}%` }} title={`ACH: ${shares.credit_transfers + shares.direct_debits}%`}></div>
                                  {shares.checks > 0 && (
                                    <div className="h-full bg-amber-600" style={{ width: `${shares.checks}%` }} title={`Checks: ${shares.checks}%`}></div>
                                  )}
                                  <div className="h-full bg-gray-700" style={{ width: `${100 - (shares.cards + shares.credit_transfers + shares.direct_debits + shares.checks)}%` }} title="Others"></div>
                                </div>
                                <div className="flex gap-2.5 text-[9px] text-gray-400 font-sans">
                                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>Card {shares.cards}%</span>
                                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>ACH {(shares.credit_transfers + shares.direct_debits).toFixed(1)}%</span>
                                  {shares.checks > 0 && (
                                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>Check {shares.checks}%</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 rounded bg-[#030712] border border-[#1F2937] text-xs font-mono text-gray-400 leading-relaxed">
                  <span className="text-amber-400 font-bold">COMPARATIVE SUMMARY:</span> Cashless transaction densities exhibit steep structural variance. While the US and UK rely heavily on cards (exceeding 60% share), the Eurozone and Japan show prominent usage of credit transfers/ACH channels for settlement, whereas Japan retains a high cash-to-GDP index (~21.8%) reflecting unique domestic clearing preferences.
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* 2. INTELLIGENCE SIDEBAR (30% Width) */}
      <aside className="w-full lg:w-[30%] lg:h-full border-t lg:border-t-0 lg:border-l border-[#1F2937] bg-[#0B1117] p-6 flex flex-col overflow-y-auto gap-6 justify-between">
        
        {/* Sections A, B, C, D */}
        <div className="space-y-6">
          {/* SECTION A: Title & High-level Metric */}
          <div className="border-b border-[#1F2937] pb-4">
            <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Real-Time Intelligence Summary</span>
            </div>
            <h2 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Headline Performance Spread</h2>
            
            <div className="text-2xl font-bold tracking-tight text-white mt-1">
              {activeTopTab === "analyzer"
                ? `${data.card_rail.finality_time_display} clearing time vs ~1.0 hr on-chain`
                : "Empirical macro data and live mempool indicators active"
              }
            </div>
            <div className="text-xs font-mono text-emerald-400 mt-1.5 flex items-center gap-1">
              <span>Savings index:</span>
              <strong className="px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-800">
                {activeTopTab === "analyzer" && data.insights.savings_dollars > 0 
                  ? `${(data.card_rail.fee_percentage / (data.on_chain_rail.fee_percentage || 1)).toFixed(0)}x cheaper fees` 
                  : "Legacy rail optimized"
                }
              </strong>
            </div>
          </div>

          {/* SECTION B: Why This Matters */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-mono text-gray-400 uppercase tracking-wider">
              <HelpCircle className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span>Why This Matters (Infrastructure)</span>
            </div>
            <div className="p-3 bg-[#030712] border border-[#1F2937] rounded text-xs text-gray-400 leading-relaxed font-mono">
              Settlement infrastructure determines who waits, who pays fees, and who holds counterparty risk — comparing on-chain and card rails reveals the hidden costs and control points embedded in every transaction.
            </div>
          </div>

          {/* SECTION C: Who Controls the Rail */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-mono text-gray-400 uppercase tracking-wider">
              <Users className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span>Who Controls the Rail (Governance)</span>
            </div>
            <div className="p-3 bg-[#030712] border border-[#1F2937] rounded text-xs text-gray-400 leading-relaxed font-mono">
              Card networks (Visa, Mastercard), issuing banks, and acquiring processors jointly control card settlement timing and fees; Bitcoin settlement is governed by miners and node operators with no single gatekeeper.
            </div>
          </div>

          {/* SECTION D: Functional Filters & Tooltips */}
          {activeTopTab === "analyzer" ? (
            <div className="space-y-4 border-t border-[#1F2937] pt-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Interactive Parameters</h3>

              {/* Use-Case Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Settlement Use-Case Scenarios</label>
                <select 
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full bg-[#030712] border border-[#1F2937] text-white px-3 py-2 rounded text-xs font-mono focus:outline-none focus:cyan-glow cursor-pointer transition-all"
                >
                  <option value="retail">Retail Purchase (Low ticket, standard card)</option>
                  <option value="b2b">B2B Wholesale Payment (High ticket, corporate)</option>
                  <option value="cross_border">Cross-Border Remittance (FX, correspondent)</option>
                  <option value="micropayment">Micropayment / Sub-Dollar (Extreme low size)</option>
                </select>
              </div>

              {/* Custom Amount */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Override Amount ($)</label>
                  <span className="text-[10px] font-mono text-[#38BDF8] italic">Default: ${LOCAL_SCENARIOS[useCase].default_amount}</span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                  <input 
                    type="number"
                    placeholder={LOCAL_SCENARIOS[useCase].default_amount.toString()}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-[#030712] border border-[#1F2937] text-white pl-8 pr-3 py-2 rounded text-xs font-mono focus:outline-none focus:cyan-glow transition-all"
                  />
                </div>
              </div>

              {/* Custom Sat Rate */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Bitcoin gas rate (sat/vB)</label>
                  {liveBtcStats?.is_live ? (
                    <a 
                      href="https://mempool.space" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[9px] font-mono text-[#38BDF8] hover:underline flex items-center gap-1"
                    >
                      <span className="inline-block w-1.5 h-1.5 bg-[#38BDF8] rounded-full animate-pulse"></span>
                      <span>Live fee: {liveBtcStats.sat_per_vbyte} (mempool.space)</span>
                    </a>
                  ) : (
                    <a 
                      href="https://mempool.space" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[9px] font-mono text-gray-500 hover:text-gray-300 hover:underline"
                    >
                      mempool.space API offline
                    </a>
                  )}
                </div>
                <input 
                  type="number"
                  placeholder="25"
                  value={customSatRate}
                  onChange={(e) => setCustomSatRate(e.target.value)}
                  className="w-full bg-[#030712] border border-[#1F2937] text-white px-3 py-2 rounded text-xs font-mono focus:outline-none focus:cyan-glow transition-all"
                />
              </div>
              
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded text-[11px] text-[#38BDF8] font-mono leading-relaxed">
                <strong>INTELLIGENCE NOTE:</strong> {data.insights.cost_insight}
              </div>
            </div>
          ) : (
            <div className="space-y-4 border-t border-[#1F2937] pt-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ingestion Control Center</h3>
              
              <button 
                onClick={handleTriggerIngest}
                disabled={isIngesting}
                className="w-full flex items-center justify-center gap-2 bg-[#0B1117] border border-cyan-500 text-cyan-400 font-mono hover:bg-cyan-950/40 transition-all py-2 rounded text-xs font-semibold uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isIngesting ? "animate-spin" : ""}`} />
                <span>{isIngesting ? "Running pipeline..." : "Ingest / Refresh Data"}</span>
              </button>

              {macroStatus && (
                <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-800/40 text-[10px] text-cyan-400 font-mono text-center animate-pulse">
                  {macroStatus}
                </div>
              )}

              <div className="text-[10px] font-mono text-gray-400 leading-relaxed border-t border-gray-800/60 pt-3 mt-1">
                <strong>DATA PIPELINE STATS:</strong><br />
                - mempool.space API: <span className={macroData?.mempool_stats?.is_live ? "text-emerald-400" : "text-amber-500"}>{macroData?.mempool_stats?.is_live ? "CONNECTED" : "FALLBACK"}</span><br />
                - Fed study: <span className="text-emerald-400">INGESTED (JSON)</span><br />
                - BIS CPMI Red Book: <span className="text-emerald-400">INGESTED (JSON)</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION E: Download Sample Data */}
        <div className="border-t border-[#1F2937] pt-4 mt-6">
          {activeTopTab === "analyzer" ? (
            <button 
              onClick={handleDownloadCSV}
              className="w-full flex items-center justify-center gap-2 bg-[#0B1117] border border-[#38BDF8] text-[#38BDF8] font-mono hover:bg-[#38BDF8] hover:text-[#030712] transition-all py-2.5 rounded text-xs font-semibold uppercase tracking-wider shadow-[0_0_8px_rgba(56,189,248,0.1)] active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download Sample Data (CSV)</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(macroData, null, 2));
                const link = document.createElement("a");
                link.setAttribute("href", jsonContent);
                link.setAttribute("download", "payments_macro_ingested_summary.json");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#0B1117] border border-[#38BDF8] text-[#38BDF8] font-mono hover:bg-[#38BDF8] hover:text-[#030712] transition-all py-2.5 rounded text-xs font-semibold uppercase tracking-wider shadow-[0_0_8px_rgba(56,189,248,0.1)] active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export Ingested Data (JSON)</span>
            </button>
          )}
          <div className="text-[9px] text-center font-mono text-gray-500 mt-2">
            {activeTopTab === "analyzer"
              ? "CSV includes active scenario metrics, fees, speed, and gatekeeper lists."
              : "JSON includes full mempool snapshot, BIS CPMI countries, and Fed Payment data."
            }
          </div>
        </div>

      </aside>

    </div>
  );
}
