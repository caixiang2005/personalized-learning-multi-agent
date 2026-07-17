/**
 * @file DatabaseAdmin.tsx
 * @description 数据库管理页面（只读浏览，开发调试用）
 * @backend GET /api/admin/db/tables · GET /api/admin/db/table/:name · POST /api/admin/db/query
 */
import { useCallback, useEffect, useState } from "react";
import {
  Database, Table2, ChevronRight, RefreshCw,
  Play, Terminal, ChevronLeft, ChevronLast, Loader2,
} from "lucide-react";
import { API } from "../lib/api/endpoints";
import { authHeaders } from "../lib/auth/token";

interface TableInfo {
  name: string;
  rowCount: number;
  hasData: boolean;
}

interface ColumnInfo {
  name: string;
  type: string;
}

interface TableData {
  tableName: string;
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function DatabaseAdmin() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sqlInput, setSqlInput] = useState("");
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: Record<string, unknown>[] } | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.dbAdmin.tables, {
        headers: { ...authHeaders() },
      });
      const json = await res.json();
      if (json.code === 200) setTables(json.data.tables);
      else setError(json.msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const fetchTableData = useCallback(async (tableName: string, p: number) => {
    setTableLoading(true);
    setError("");
    setQueryResult(null);
    try {
      const res = await fetch(API.dbAdmin.tableData(tableName) + `?page=${p}&page_size=50`, {
        headers: { ...authHeaders() },
      });
      const json = await res.json();
      if (json.code === 200) setTableData(json.data);
      else setError(json.msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
    }
    setTableLoading(false);
  }, []);

  const selectTable = (name: string) => {
    setSelectedTable(name);
    setPage(1);
    fetchTableData(name, 1);
  };

  const changePage = (newPage: number) => {
    if (!selectedTable) return;
    setPage(newPage);
    fetchTableData(selectedTable, newPage);
  };

  const executeQuery = async () => {
    const sql = sqlInput.trim();
    if (!sql) return;
    setQueryLoading(true);
    setError("");
    setTableData(null);
    try {
      const res = await fetch(API.dbAdmin.query, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ sql }),
      });
      const json = await res.json();
      if (json.code === 200) setQueryResult(json.data);
      else setError(json.msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
    }
    setQueryLoading(false);
  };

  return (
    <div className="scholar-page">
      <div className="scholar-page-header">
        <div className="scholar-page-header__start">
          <Database size={20} className="text-[var(--scholar-primary)]" />
          <div>
            <h1 className="scholar-page-header__title">数据库管理</h1>
            <p className="scholar-page-header__subtitle">数据表浏览</p>
          </div>
        </div>
        <button onClick={fetchTables} className="scholar-btn scholar-btn--secondary" title="刷新">
          <RefreshCw size={15} />
          刷新
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* 左侧：表列表 */}
        <div className="scholar-card p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Table2 size={15} className="text-[var(--scholar-primary)]" />
            数据表
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[var(--scholar-text-muted)]" /></div>
          ) : (
            <ul className="space-y-1">
              {tables.map((t) => (
                <li key={t.name}>
                  <button
                    onClick={() => selectTable(t.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      selectedTable === t.name
                        ? "bg-[var(--scholar-primary)]/10 text-[var(--scholar-primary)] font-medium"
                        : "hover:bg-[var(--scholar-bg)] text-[var(--scholar-text-secondary)]"
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="text-xs text-[var(--scholar-text-muted)]">{t.rowCount} 行</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 右侧：数据视图 + SQL */}
        <div className="space-y-4">
          {/* SQL 查询区 */}
          <div className="scholar-card p-4">
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Terminal size={15} className="text-[var(--scholar-primary)]" />
              自定义查询
            </h2>
            <div className="flex gap-2">
              <input
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeQuery()}
                placeholder="SELECT * FROM users LIMIT 10"
                className="input-field flex-1 text-sm font-mono"
              />
              <button onClick={executeQuery} disabled={queryLoading} className="scholar-btn scholar-btn--primary">
                {queryLoading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                执行
              </button>
            </div>
          </div>

          {/* 数据展示 */}
          {tableLoading ? (
            <div className="scholar-card p-8 flex justify-center">
              <Loader2 size={24} className="animate-spin text-[var(--scholar-text-muted)]" />
            </div>
          ) : tableData ? (
            <div className="scholar-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">{tableData.tableName}</h2>
                <span className="text-xs text-[var(--scholar-text-muted)]">
                  共 {tableData.totalCount} 行 · 第 {tableData.page}/{tableData.totalPages} 页
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--scholar-border)]">
                      <th className="text-left py-2 px-2 font-medium text-[var(--scholar-text-muted)]">#</th>
                      {tableData.columns.map((col) => (
                        <th key={col.name} className="text-left py-2 px-2 font-medium text-[var(--scholar-text-muted)]">
                          {col.name}<br /><span className="text-[10px] opacity-60">{col.type}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, i) => (
                      <tr key={i} className="border-b border-[var(--scholar-border)]/50 hover:bg-[var(--scholar-bg)]/50">
                        <td className="py-1.5 px-2 text-[var(--scholar-text-muted)]">{(tableData.page - 1) * tableData.pageSize + i + 1}</td>
                        {tableData.columns.map((col) => (
                          <td key={col.name} className="py-1.5 px-2 text-[var(--scholar-text-secondary)] max-w-[200px] truncate" title={String(row[col.name] ?? "")}>
                            {formatCellValue(row[col.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tableData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => changePage(1)} disabled={page <= 1} className="scholar-btn scholar-btn--icon">
                    <ChevronLast size={14} className="rotate-180" />
                  </button>
                  <button onClick={() => changePage(page - 1)} disabled={page <= 1} className="scholar-btn scholar-btn--icon">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-[var(--scholar-text-muted)]">{page} / {tableData.totalPages}</span>
                  <button onClick={() => changePage(page + 1)} disabled={page >= tableData.totalPages} className="scholar-btn scholar-btn--icon">
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => changePage(tableData.totalPages)} disabled={page >= tableData.totalPages} className="scholar-btn scholar-btn--icon">
                    <ChevronLast size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : queryResult ? (
            <div className="scholar-card p-4">
              <h2 className="text-sm font-semibold mb-3">查询结果（{queryResult.rows.length} 行）</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--scholar-border)]">
                      {queryResult.columns.map((col) => (
                        <th key={col} className="text-left py-2 px-2 font-medium text-[var(--scholar-text-muted)]">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, i) => (
                      <tr key={i} className="border-b border-[var(--scholar-border)]/50 hover:bg-[var(--scholar-bg)]/50">
                        {queryResult.columns.map((col) => (
                          <td key={col} className="py-1.5 px-2 text-[var(--scholar-text-secondary)] max-w-[200px] truncate">{formatCellValue(row[col])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="scholar-card p-8 flex flex-col items-center justify-center text-[var(--scholar-text-muted)]">
              <Database size={32} strokeWidth={1.5} className="mb-2 opacity-40" />
              <p className="text-sm">选择左侧数据表或输入 SQL 查询</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
