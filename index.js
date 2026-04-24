const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── CHANGE THESE TO YOUR OWN DETAILS ──────────────────────────────────────────
const USER_ID = "MANISINIKHIL_14112002";         
const EMAIL_ID = "mn9486@srmist.edu.in";  
const COLLEGE_ROLL = "RA2311003030202";       
// ─────────────────────────────────────────────────────────────────────────────

const VALID_EDGE = /^[A-Z]->[A-Z]$/;

function parseAndValidate(data) {
  const validEdges = [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();

  for (let raw of data) {
    const entry = typeof raw === "string" ? raw.trim() : String(raw).trim();

    // Self-loop check before full regex (A->A)
    if (!VALID_EDGE.test(entry) || entry[0] === entry[3]) {
      invalidEntries.push(entry);
      continue;
    }

    if (seenEdges.has(entry)) {
      // Only add to duplicates once (first duplicate occurrence)
      if (!duplicateEdges.includes(entry)) {
        duplicateEdges.push(entry);
      }
    } else {
      seenEdges.add(entry);
      validEdges.push(entry);
    }
  }

  return { validEdges, invalidEntries, duplicateEdges };
}

function buildHierarchies(validEdges) {
  // parent map: child -> first parent only
  const parentOf = {};
  const childrenOf = {};
  const allNodes = new Set();

  for (const edge of validEdges) {
    const [parent, child] = edge.split("->");
    allNodes.add(parent);
    allNodes.add(child);

    if (!childrenOf[parent]) childrenOf[parent] = [];

    // Diamond: only first-encountered parent wins
    if (parentOf[child] === undefined) {
      parentOf[child] = parent;
      childrenOf[parent].push(child);
    }
    // silently discard subsequent parent edges for same child
  }

  // Find connected components using union-find
  const uf = {};
  function find(x) {
    if (uf[x] === undefined) uf[x] = x;
    if (uf[x] !== x) uf[x] = find(uf[x]);
    return uf[x];
  }
  function union(a, b) {
    uf[find(a)] = find(b);
  }

  for (const edge of validEdges) {
    const [p, c] = edge.split("->");
    union(p, c);
  }

  // Group nodes by component
  const components = {};
  for (const node of allNodes) {
    const root = find(node);
    if (!components[root]) components[root] = new Set();
    components[root].add(node);
  }

  const hierarchies = [];

  for (const compKey of Object.keys(components)) {
    const nodes = components[compKey];

    // Find root(s): nodes not appearing as a child
    const roots = [...nodes].filter((n) => parentOf[n] === undefined);

    // Cycle detection: DFS
    function hasCycle(startNode) {
      const visited = new Set();
      const stack = new Set();
      function dfs(node) {
        if (stack.has(node)) return true;
        if (visited.has(node)) return false;
        visited.add(node);
        stack.add(node);
        for (const child of childrenOf[node] || []) {
          if (dfs(child)) return true;
        }
        stack.delete(node);
        return false;
      }
      return dfs(startNode);
    }

    // Determine effective root
    let effectiveRoot;
    if (roots.length > 0) {
      // Pick lexicographically smallest root if multiple
      effectiveRoot = roots.sort()[0];
    } else {
      // Pure cycle — lexicographically smallest node
      effectiveRoot = [...nodes].sort()[0];
    }

    const cycleDetected = hasCycle(effectiveRoot) ||
      [...nodes].some((n) => hasCycle(n));

    if (cycleDetected) {
      hierarchies.push({
        root: effectiveRoot,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    // Build nested tree object
    function buildTree(node) {
      const obj = {};
      for (const child of childrenOf[node] || []) {
        obj[child] = buildTree(child);
      }
      return obj;
    }

    // Depth = longest root-to-leaf path (node count)
    function calcDepth(node) {
      const kids = childrenOf[node] || [];
      if (kids.length === 0) return 1;
      return 1 + Math.max(...kids.map(calcDepth));
    }

    const tree = { [effectiveRoot]: buildTree(effectiveRoot) };
    const depth = calcDepth(effectiveRoot);

    hierarchies.push({ root: effectiveRoot, tree, depth });
  }

  return hierarchies;
}

function buildSummary(hierarchies) {
  const trees = hierarchies.filter((h) => !h.has_cycle);
  const cycles = hierarchies.filter((h) => h.has_cycle);

  let largestRoot = null;
  let largestDepth = -1;

  for (const t of trees) {
    if (
      t.depth > largestDepth ||
      (t.depth === largestDepth && t.root < largestRoot)
    ) {
      largestDepth = t.depth;
      largestRoot = t.root;
    }
  }

  return {
    total_trees: trees.length,
    total_cycles: cycles.length,
    largest_tree_root: largestRoot,
  };
}

app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "data must be an array" });
    }

    const { validEdges, invalidEntries, duplicateEdges } = parseAndValidate(data);
    const hierarchies = buildHierarchies(validEdges);
    const summary = buildSummary(hierarchies);

    return res.json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: COLLEGE_ROLL,
      hierarchies,
      invalid_entries: invalidEntries,
      duplicate_edges: duplicateEdges,
      summary,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Serve frontend for all other routes
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
