import React from "react";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  Outlet,
} from "react-router-dom";
import { motion } from "framer-motion";
import { html } from "./htm.js";
import {
  Home,
  SortInsertion,
  SortShell,
  SortHeap,
  SortMerge,
  SortCount,
  SortRadix,
  LinkedLists,
  StackPage,
  QueuePage,
  BSTPage,
  RBTreePage,
  HeapPQPage,
  HashTablePage,
} from "./screens/pages.js";

/**
 * GitHub Pages serves project sites at /<repo>/...
 * HashRouter must use the same basename or @remix-run/router throws (history.ts invariant).
 */
function routerBasename() {
  const path = typeof window !== "undefined" ? window.location.pathname || "" : "";
  const parts = path.split("/").filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0];
  if (first.includes(".")) return "";
  return `/${first}`;
}

function NavItem({ to, color, children }) {
  return html`
    <${NavLink}
      to=${to}
      className=${({ isActive }) => "nav-btn" + (isActive ? " active" : "")}
    >
      <span className="nav-dot" style=${{ background: color }} />
      <span>${children}</span>
    </${NavLink}>
  `;
}

/** Shell must wrap children in a parent <Route> so NavLinks have route context (RR v6). */
function AppShellLayout() {
  return html`
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">CS Study Lab</div>
        <${NavItem} to="/" color="#00d4aa">Welcome</${NavItem}>

        <div className="sidebar-section-label">Sorting (Lab 8)</div>
        <${NavItem} to="/sort/insertion" color="#ffc233">Insertion sort</${NavItem}>
        <${NavItem} to="/sort/shell" color="#ff6b9d">Shell sort</${NavItem}>
        <${NavItem} to="/sort/heap" color="#7c5cff">Heap sort</${NavItem}>
        <${NavItem} to="/sort/merge" color="#3db8ff">Merge sort</${NavItem}>
        <${NavItem} to="/sort/count" color="#00d4aa">Counting sort</${NavItem}>
        <${NavItem} to="/sort/radix" color="#ffa23a">Radix sort</${NavItem}>

        <div className="sidebar-section-label">Data structures</div>
        <${NavItem} to="/ds/linked" color="#ff6b9d">Linked lists</${NavItem}>
        <${NavItem} to="/ds/stack" color="#7c5cff">Stack</${NavItem}>
        <${NavItem} to="/ds/queue" color="#3db8ff">Queue</${NavItem}>
        <${NavItem} to="/ds/bst" color="#ffc233">Binary search tree</${NavItem}>
        <${NavItem} to="/ds/rbt" color="#ff3d7f">Red–black tree</${NavItem}>
        <${NavItem} to="/ds/heap-pq" color="#00d4aa">Heap / priority queue</${NavItem}>
        <${NavItem} to="/ds/hash" color="#a68cff">Hash table</${NavItem}>
      </aside>
      <${motion.main}
        className="main"
        initial=${{ opacity: 0 }}
        animate=${{ opacity: 1 }}
        transition=${{ duration: 0.35 }}
      >
        <${Outlet} />
      </${motion.main}>
    </div>
  `;
}

function MainRoutes() {
  return html`
    <${Routes}>
      <${Route} path="/" element=${React.createElement(AppShellLayout)}>
        <${Route} index element=${React.createElement(Home)} />
        <${Route} path="sort/insertion" element=${React.createElement(SortInsertion)} />
        <${Route} path="sort/shell" element=${React.createElement(SortShell)} />
        <${Route} path="sort/heap" element=${React.createElement(SortHeap)} />
        <${Route} path="sort/merge" element=${React.createElement(SortMerge)} />
        <${Route} path="sort/count" element=${React.createElement(SortCount)} />
        <${Route} path="sort/radix" element=${React.createElement(SortRadix)} />
        <${Route} path="ds/linked" element=${React.createElement(LinkedLists)} />
        <${Route} path="ds/stack" element=${React.createElement(StackPage)} />
        <${Route} path="ds/queue" element=${React.createElement(QueuePage)} />
        <${Route} path="ds/bst" element=${React.createElement(BSTPage)} />
        <${Route} path="ds/rbt" element=${React.createElement(RBTreePage)} />
        <${Route} path="ds/heap-pq" element=${React.createElement(HeapPQPage)} />
        <${Route} path="ds/hash" element=${React.createElement(HashTablePage)} />
        <${Route} path="*" element=${React.createElement(Navigate, { to: "/", replace: true })} />
      </${Route}>
    </${Routes}>
  `;
}

export default function App() {
  const basename = routerBasename();
  return html`
    <${HashRouter} basename=${basename}>
      <${MainRoutes} />
    </${HashRouter}>
  `;
}
