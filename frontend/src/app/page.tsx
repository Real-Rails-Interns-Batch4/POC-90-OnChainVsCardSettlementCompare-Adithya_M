"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Clock, 
  HelpCircle, 
  Users, 
  ShieldAlert, 
  ArrowRight, 
  Download, 
  Server, 
  Globe, 
  Layers, 
  Percent, 
  Zap, 
  CheckCircle2, 
  Info,
  TrendingDown
} from "lucide-react";
import ReactFlow, { Background, Controls, Edge, Node } from "reactflow";
import "reactflow/dist/style.css";

// --- LOCAL FALLBACK DATA & CALCULATIONS (Extreme Durability Guardrail) ---
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
    ? `On-Chain Bitcoin saves $${savings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} in fees compared to Card Settlement (${btc_fee_pct.toFixed(3)}% vs {card_fee_pct.toFixed(3)}%).`
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
  
  // Real-time API States
  const [liveBtcStats, setLiveBtcStats] = useState<{ sat_per_vbyte: number; btc_price_usd: number; is_live: boolean } | null>(null);
  const [data, setData] = useState<any>(null);
  const [flowTab, setFlowTab] = useState<"card" | "btc">("card");

  // Prevent SSR Hydration Issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Recommended Mempool Fee & Price on Load
  useEffect(() => {
    const fetchMempool = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/mempool");
        if (res.ok) {
          const stats = await res.json();
          setLiveBtcStats(stats);
          if (stats.sat_per_vbyte && !customSatRate) {
            setCustomSatRate(stats.sat_per_vbyte.toString());
          }
        }
      } catch (err) {
        console.warn("FastAPI backend not running or unreachable. Auto-switching to mock data failover.");
      }
    };
    fetchMempool();
  }, []);

  // Recalculate or Fetch Compare Data whenever parameters change
  useEffect(() => {
    const fetchCompareData = async () => {
      const amtParam = customAmount ? parseFloat(customAmount) : LOCAL_SCENARIOS[useCase].default_amount;
      const satParam = customSatRate ? parseInt(customSatRate) : (liveBtcStats?.sat_per_vbyte || 25);
      
      try {
        const url = `http://localhost:8000/api/compare?use_case=${useCase}&amount=${amtParam}&sat_rate=${satParam}`;
        const res = await fetch(url);
        if (res.ok) {
          const fetchedData = await res.json();
          setData(fetchedData);
          setIsLiveBackend(true);
        } else {
          throw new Error("Backend non-ok response");
        }
      } catch (err) {
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
      window.open(`http://localhost:8000/api/export?use_case=${useCase}&amount=${amtParam}&sat_rate=${satParam}`, "_blank");
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
          </div>
        </div>

        {/* SIDE-BY-SIDE COMPARE PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Settlement Card */}
          <div className="rounded-lg border border-[#1F2937] bg-[#0B1117] p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Card Network</span>
                <span className="px-2 py-0.5 bg-indigo-950/50 border border-indigo-800 text-indigo-400 rounded text-[10px] font-mono">
                  Legacy / Institutional
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
                  <span>Interchange Fee (Issuer)</span>
                  <span className="text-gray-200">${data.card_rail.interchange_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Acquirer/Processor Fee</span>
                  <span className="text-gray-200">${data.card_rail.acquirer_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Assessment Fee</span>
                  <span className="text-gray-200">${data.card_rail.network_fee.toFixed(2)}</span>
                </div>
                {data.card_rail.fx_fee > 0 && (
                  <div className="flex justify-between text-indigo-300">
                    <span>FX Markup & Conversion</span>
                    <span>${data.card_rail.fx_fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Flat Gateway Transaction Fee</span>
                  <span className="text-gray-200">${data.card_rail.flat_fee.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-800 pt-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-400">Settlement Speed: </span>
                  <strong className="text-white">{data.card_rail.finality_time_display}</strong>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400">Counterparty Risk: </span>
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
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest">On-Chain Protocol</span>
                <span className="px-2 py-0.5 bg-cyan-950/50 border border-cyan-800 text-[#38BDF8] rounded text-[10px] font-mono">
                  Sovereign / Cryptographic
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
                  <span>Network Gas Rate</span>
                  <span className="text-gray-200">{data.on_chain_rail.sat_rate} sat/vB</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Transaction Weight</span>
                  <span className="text-gray-200">{data.on_chain_rail.tx_size_vbytes} vBytes</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Mining Fee (Sats)</span>
                  <span className="text-gray-200">{data.on_chain_rail.total_sats.toLocaleString()} Sats</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Fee Model</span>
                  <span className="text-gray-200">Independent of value</span>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-800 pt-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-[#38BDF8] flex-shrink-0" />
                <div>
                  <span className="text-gray-400">Settlement Speed: </span>
                  <strong className="text-white">{data.on_chain_rail.finality_time_display}</strong>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400">Counterparty Risk: </span>
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
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>Bitcoin Lightning Network (L2 alternative)</span>
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
                <span className="text-[#38BDF8] font-semibold">Bitcoin On-Chain (Settlement depth: 6 Blocks)</span>
                <span className="text-gray-300">~60 Minutes</span>
              </div>
              <div className="h-2 w-full bg-gray-900 rounded overflow-hidden">
                {/* 1 hour represents roughly 2% of a 48 hour scale, but let's draw it visibly */}
                <div className="h-full bg-[#38BDF8] w-[5%] rounded shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div>
              </div>
            </div>

            {/* Card Settlement */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-indigo-400 font-semibold">Card clearing window (Standard ACH/Wire clearing)</span>
                <span className="text-gray-300">{data.card_rail.finality_time_display}</span>
              </div>
              <div className="h-2 w-full bg-gray-900 rounded overflow-hidden">
                <div className="h-full bg-[#818CF8] w-[45%] rounded"></div>
              </div>
            </div>

            {/* Dispute Vulnerability Window */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-red-400 font-semibold">Card Network dispute/chargeback window (Payment Reversibility)</span>
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
                className={`px-3 py-1 text-xs rounded transition-all ${
                  flowTab === "card" 
                    ? "bg-[#1F2937] text-white border-b border-[#38BDF8]" 
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Card Network (Complex)
              </button>
              <button 
                onClick={() => setFlowTab("btc")}
                className={`px-3 py-1 text-xs rounded transition-all ${
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
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Percent className="h-4 w-4 text-[#38BDF8]" />
            <span>Scenario Comparison Ledger</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#1F2937] text-gray-400">
                  <th className="py-2.5 px-3">Scenario</th>
                  <th className="py-2.5 px-3">Default Txn</th>
                  <th className="py-2.5 px-3 text-indigo-400">Card Settlement Fee</th>
                  <th className="py-2.5 px-3 text-[#38BDF8]">On-Chain Fee (Est)</th>
                  <th className="py-2.5 px-3 text-emerald-400">Total Savings</th>
                  <th className="py-2.5 px-3">Primary Efficiency Rail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {Object.keys(LOCAL_SCENARIOS).map((key) => {
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
                      <td className="py-3 px-3 font-semibold text-white">{s.name}</td>
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
              {data.card_rail.finality_time_display} clearing time vs ~1.0 hr on-chain
            </div>
            <div className="text-xs font-mono text-emerald-400 mt-1.5 flex items-center gap-1">
              <span>Savings index:</span>
              <strong className="px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-800">
                {data.insights.savings_dollars > 0 
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
                {liveBtcStats?.is_live && (
                  <span className="text-[10px] font-mono text-[#38BDF8] flex items-center gap-0.5">
                    <span className="inline-block w-1.5 h-1.5 bg-[#38BDF8] rounded-full animate-ping"></span>
                    <span>Live Recommended: {liveBtcStats.sat_per_vbyte}</span>
                  </span>
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
        </div>

        {/* SECTION E: Download Sample Data */}
        <div className="border-t border-[#1F2937] pt-4 mt-6">
          <button 
            onClick={handleDownloadCSV}
            className="w-full flex items-center justify-center gap-2 bg-[#0B1117] border border-[#38BDF8] text-[#38BDF8] font-mono hover:bg-[#38BDF8] hover:text-[#030712] transition-all py-2.5 rounded text-xs font-semibold uppercase tracking-wider shadow-[0_0_8px_rgba(56,189,248,0.1)] active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>Download Sample Data (CSV)</span>
          </button>
          <div className="text-[9px] text-center font-mono text-gray-500 mt-2">
            CSV includes active scenario metrics, fees, speed, and gatekeeper lists.
          </div>
        </div>

      </aside>

    </div>
  );
}
