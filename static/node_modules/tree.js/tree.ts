// Copyright Erik Weitnauer 2012-2015.

/** This is an implementation of fully linked nary-trees. Each non-leaf node has an array
of its children `children`, a reference to its left sibling `ls`, a reference to its right
sibling `rs` and a reference to its parent `parent`.
The Tree object is a collection of methods to handle tree structures, its not instanciated
itself. Instead, each object can be a tree node.

Most of the methods can accept both a single node or an array of nodes to work on.
*/

/// To get all static methods of the Tree object as instance methods on your
/// object, you can make it inherit from the "TreeNode" class
export class TreeNode {
  children: TreeNode[];
  parent: TreeNode | null;
  ls: TreeNode | null;
  rs: TreeNode | null;
  id: string;
  constructor() {
    this.children = [];
    this.parent = null;
    this.ls = null;
    this.rs = null;
    this.id = Tree.uid();
  }
  stringify() {
    return Tree.stringify(this);
  }
  clone(keep_ids?, fields_to_clone?) {
    return Tree.clone(this, keep_ids, fields_to_clone);
  }
  get_mapping_to(target) {
    return Tree.get_mapping_between(this, target);
  }
  get_1to1_mapping_to(target, strict = false) {
    return Tree.get_1to1_mapping_between(this, target, strict);
  }
  insert(idx, node) {
    return Tree.insert(this, idx, node);
  }
  insert_range(idx, nodes) {
    return Tree.insert_range(this, idx, nodes);
  }
  append_range(nodes) {
    return Tree.append_range(this, nodes);
  }
  append(node) {
    return Tree.append(this, node);
  }
  remove() {
    return Tree.remove(this);
  }
  remove_range(nodes) {
    return Tree.remove_range(nodes);
  }
  replace_with(other) {
    return Tree.replace(this, other);
  }
  switch_with_sibling(other) {
    return Tree.switch_siblings(this, other);
  }
  validate() {
    return Tree.validate(this);
  }
  get_child(path) {
    return Tree.get_child(path, this);
  }
  get_parent(level) {
    return Tree.get_parent(level, this);
  }
  get_path() {
    return Tree.get_path(this);
  }
  for_each(f) {
    return Tree.for_each(f, this);
  }
  map(f) {
    return Tree.map(f, this);
  }
  filter(f) {
    return Tree.filter(f, this);
  }
  filterRange(f, no_overlap) {
    return Tree.filterRange(f, this, no_overlap);
  }
  select_all() {
    return Tree.select_all(this);
  }
  select_first(f) {
    return Tree.select_first(f, this);
  }
  get_leaf_nodes() {
    return Tree.get_leaf_nodes(this);
  }
  is_root() {
    return Tree.is_root(this);
  }
  get_root() {
    return Tree.get_root(this);
  }
  get_by_value(value) {
    return Tree.get_by_value(value, this);
  }
  get_by_id(id) {
    return Tree.get_by_id(id, this);
  }
  has_children() {
    return this.children && this.children.length > 0;
  }
  get_idx() {
    return Tree.get_idx(this);
  }
}

/** Adds a uid() function to Tree, that returns a random hex number with 16 digets as
 * string. */
const uid = (function () {
  const b32 = 0x100000000,
    f = 0xf,
    b: string[] = [],
    str = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ];
  function uid() {
    let i = 0;
    let r = Math.random() * b32;
    b[i++] = str[r & f];
    b[i++] = str[(r >>> 4) & f];
    b[i++] = str[(r >>> 8) & f];
    b[i++] = str[(r >>> 12) & f];
    b[i++] = str[(r >>> 16) & f];
    b[i++] = str[(r >>> 20) & f];
    b[i++] = str[(r >>> 24) & f];
    b[i++] = str[(r >>> 28) & f];
    r = Math.random() * b32;
    b[i++] = str[r & f];
    b[i++] = str[(r >>> 4) & f];
    b[i++] = str[(r >>> 8) & f];
    b[i++] = str[(r >>> 12) & f];
    b[i++] = str[(r >>> 16) & f];
    b[i++] = str[(r >>> 20) & f];
    b[i++] = str[(r >>> 24) & f];
    b[i++] = str[(r >>> 28) & f];
    return '_' + b.join('');
  }
  return uid;
})();

export class Tree {
  /// Will parse a sting like '[A,B[b1,b2,b3],C]' and return the top-level node of a
  /// tree structure. If there are more than a single top-level node, an array of them
  /// is returned (e.g. 'A,B'). Use square brackets to denote children of a node and commas
  /// to separate nodes from each other. You can use any names for the nodes except ones
  /// containing ',', '[' or ']'. The names will be saved in each node's `value` field.
  /// Nodes will also be created in absense of values, e.g. '[,]' will return an object
  /// with empty value that has an array `children` with two nodes with empty values.
  static parse(str) {
    const top = new TreeNode();
    let curr = top.append(new TreeNode());
    let i;
    curr.value = '';
    for (i = 0; i < str.length; i++) {
      const c = str[i];
      if (c == '[') {
        curr = curr.append(new TreeNode());
        curr.value = '';
      } else if (c == ']') {
        curr = curr.parent;
        if (curr === top) throw 'parse error';
      } else if (c == ',') {
        curr = curr.parent.append(new TreeNode());
        curr.value = '';
      } else {
        curr.value += c;
      }
    }
    for (i = 0; i < top.children.length; i++) top.children[i].parent = null;
    if (top.children.length === 1) return top.children[0];
    return top.children;
  }

  /// Inverse of Tree.parse, returns a string representation of the nodes, using their
  /// `value` fields. This is just for debugging and allows you to look at the structure
  /// of a tree and the `value` fields of its nodes. `nodes` can be a single node or an
  /// array of nodes.
  static stringify(nodes: TreeNode | TreeNode[]) {
    const f = function (node) {
      let str = '';
      if ('value' in node) str += node.value;
      if (node.children && node.children[0]) {
        str += '[' + node.children.map(f).join(',') + ']';
      }
      return str;
    };
    if (!Array.isArray(nodes)) nodes = [nodes];
    return nodes.map(f).join(',');
  }

  /// Will clone a node and its children. Attributes beside 'children', 'ls', 'rs' and 'parent' will
  /// just be a shallow copy of the original nodes. Attributes starting with '_' will not be copied at
  /// all. 'ls', 'rs' and 'parent' will be set to the correct values for all children and will be set to
  /// undefined for the passed node. A new random id is assigned to the cloned node if the original had
  /// an id, unless the optional keep_ids parameter is passed as true.
  /// `nodes` can either be a single node or an array of nodes. The cloned node or nodes are returned.
  static clone(nodes, keep_ids?, fields_to_clone?) {
    const f = function (node) {
      let i;
      const cloned = new node.constructor();
      if (fields_to_clone) {
        for (i = 0; i < fields_to_clone.length; i++)
          cloned[fields_to_clone[i]] = node[fields_to_clone[i]];
      } else {
        for (const key in node) {
          if (key[0] !== '_') cloned[key] = node[key];
        }
      }
      delete cloned.ls;
      delete cloned.rs;
      delete cloned.parent;
      if (node.id && !keep_ids) cloned.id = Tree.uid();
      if (node.children) {
        cloned.children = [];
        for (i = 0; i < node.children.length; i++) {
          cloned.children.push(f(node.children[i]));
          cloned.children[i].parent = cloned;
        }
        for (i = 0; i < node.children.length; i++) {
          cloned.children[i].ls = cloned.children[i - 1];
          cloned.children[i].rs = cloned.children[i + 1];
        }
      }
      return cloned;
    };
    if (!Array.isArray(nodes)) return f(nodes);
    const cloned = nodes.map(f);
    // make sure that the cloned nodes are siblings to each other, if the
    // original nodes were siblings, too
    if (nodes.length > 1)
      for (let i = 0; i < nodes.length; i++) {
        if (i > 0 && nodes[i].ls === nodes[i - 1]) cloned[i].ls = cloned[i - 1];
        if (i < nodes.length - 1 && nodes[i].rs === nodes[i + 1])
          cloned[i].rs = cloned[i + 1];
      }

    return cloned;
  }

  /**
   * Pass two identically structured trees or arrays of trees and the method
   * will return an object that maps the ids of all source tree nodes to arrays
   * of the respective target tree nodes.
   *
   * If a source node is a leaf node while its corresponding target node has
   * children, the source node will be mapped to an array containing the target
   * node and all its descendents.
   *
   * If a source node has children while its corresponding target node is a
   * leaf node, the source node's children all get mapped to arrays containing
   * the same target leaf node as only element.
   *
   * If the only1to1 parameter is passed as true, the function will not allow
   * to two cases above and raise an exception should the structure of source
   * and target tree differ. In cases where the two cases above do not apply
   * and a source node has more or less children than its corresponding target
   * node, the method throws an exception. It also throws an exception if there
   * are duplicate ids in the source tree.
   */
  static get_mapping_between(source_tree, target_tree) {
    const map: { [id: string]: TreeNode[] } = {};

    function mapfn(source, target) {
      if (source.id in map) throw 'duplicate id in source tree';
      map[source.id] = [target];
      if (source.children.length !== target.children.length) {
        if (!source.has_children()) map[source.id] = target.select_all();
        else if (!target.has_children())
          source.for_each(function (s) {
            map[s.id] = [target];
          });
        else throw "tree structures don't match";
      } else {
        for (let i = 0; i < source.children.length; i++)
          mapfn(source.children[i], target.children[i]);
      }
    }

    if (Array.isArray(source_tree)) {
      if (source_tree.length !== target_tree.length)
        throw "tree structures don't match";
      for (let i = 0; i < source_tree.length; i++)
        mapfn(source_tree[i], target_tree[i]);
    } else mapfn(source_tree, target_tree);

    return map;
  }

  /**
   * Pass two identically structured trees or arrays of trees and the method
   * will return an object that maps the ids of all source tree nodes to an array
   * with a single element -- the respective target tree node. If the trees / arrays are structured
   * differently, or if there is a duplicate id in the source nodes, the
   * methods throws an exception if in strict mode (by default strict=true).
   * If not in strict mode, the structure mismatch is ignored and all a partial
   * mapping is returned.
   */
  static get_1to1_mapping_between(source_tree, target_tree, strict) {
    const map: { [id: string]: TreeNode[] } = {};
    if (arguments.length < 3) strict = true;
    function mapfn(source, target) {
      if (strict && source.id in map) throw 'duplicate id in source tree';
      map[source.id] = [target];
      if (strict && source.children.length !== target.children.length)
        throw "tree structures don't match";
      const slen = source.children.length,
        tlen = target.children.length;
      for (let i = 0; i < slen; i++) {
        if (i < tlen) mapfn(source.children[i], target.children[i]);
        else
          source.children[i].for_each(function (s) {
            map[s.id] = [];
          });
      }
    }

    if (Array.isArray(source_tree)) {
      if (strict && source_tree.length !== target_tree.length)
        throw "tree structures don't match";
      const slen = source_tree.length,
        tlen = target_tree.length;
      for (let i = 0; i < slen; i++) {
        if (i < tlen) mapfn(source_tree[i], target_tree[i]);
        else
          source_tree[i].for_each(function (s) {
            map[s.id] = [];
          });
      }
    } else mapfn(source_tree, target_tree);

    return map;
  }

  /// Returns the smallest range of nodes (continuous, ordered neighbors) covering the passed
  /// nodes. The method first gets the closest common ancestor and then selects a range of its
  /// children that contains all the passed nodes.
  static nodes_to_range(nodes) {
    const N = nodes.length;
    if (N === 0) return [];
    if (N === 1) return [nodes[0]];
    let tree = nodes[0];
    while (tree.parent) tree = tree.parent;

    // get the closest common anchestor (cca)
    const paths = nodes.map(function (node) {
      return Tree.get_path(node);
    });
    const same = function (len) {
      const val = paths[0][len];
      for (let i = 0; i < paths.length; i++) {
        if (paths[i].length <= len + 1) return false; // we want an ancestor, so if already at leaf, return
        if (paths[i][len] !== val) return false;
      }
      return true;
    };
    let cpl = 0; // common path length
    while (same(cpl)) cpl++;
    const cca = Tree.get_child(paths[0].slice(0, cpl), tree);

    // get the cca's left-most and right-most child that contains one of the nodes
    let rm = -1,
      lm = cca.children.length,
      i;
    for (i = 0; i < N; i++) {
      const n = Tree.get_child(paths[i].slice(0, cpl + 1), tree);
      const idx = cca.children.indexOf(n);
      if (idx > rm) rm = idx;
      if (idx < lm) lm = idx;
    }

    // now select the whole range of nodes from left to right
    const range: TreeNode[] = [];
    for (i = lm; i <= rm; i++) range.push(cca.children[i]);
    return range;
  }

  /// Inserts a node into the tree as the child at position 'idx' of 'parent'. Returns the inserted
  /// node.
  static insert(parent, idx, node) {
    node.ls = parent.children[idx - 1];
    if (parent.children[idx - 1]) parent.children[idx - 1].rs = node;
    node.rs = parent.children[idx];
    if (parent.children[idx]) parent.children[idx].ls = node;
    node.parent = parent;
    parent.children.splice(idx, 0, node);
    return node;
  }

  /// Inserts a range of nodes at the position `idx` into the children array
  /// of the node `parent`. The `nodes` array must contain a list of direct
  /// siblings ordered from left to right.
  static insert_range(parent, idx, nodes) {
    const N = nodes.length;
    if (N === 0) return;
    nodes[0].ls = parent.children[idx - 1];
    if (parent.children[idx - 1]) parent.children[idx - 1].rs = nodes[0];
    nodes[N - 1].rs = parent.children[idx];
    if (parent.children[idx]) parent.children[idx].ls = nodes[N - 1];
    for (let i = 0; i < N; i++) nodes[i].parent = parent;
    parent.children = parent.children
      .slice(0, idx)
      .concat(nodes, parent.children.slice(idx));
    return nodes;
  }
  /// Appends a range of nodes to the end of the children array of the node `parent`.
  /// The `nodes` array must contain a list of direct siblings ordered from left to right.
  /// Returns the inserted node range.
  static append_range(parent, nodes) {
    const N = nodes.length;
    if (N === 0) return;
    const last = parent.children[parent.children.length - 1];
    if (last) last.rs = nodes[0];
    nodes[0].ls = last;
    nodes[N - 1].rs = null;
    for (let i = 0; i < N; i++) nodes[i].parent = parent;
    parent.children = parent.children.concat(nodes);
    return nodes;
  }

  /// Returns an array of all node ranges for which the passed selector function
  /// returned true. The passed node can either be a single node or an array of nodes.
  /// If no_overlap is set to true, the function will not search children of a
  /// successful match and will not include any nodes used in a successful match again.
  static filterRange(selector, node, no_overlap) {
    const result: TreeNode[][] = [];
    const nodes = Array.isArray(node) ? node : [node];
    const f = function (nodes, idx) {
      const range: TreeNode[] = [],
        n = nodes[idx];
      for (let i = idx; i < nodes.length; i++) {
        range.push(nodes[i]);
        if (selector(range)) {
          result.push(range.slice());
          if (no_overlap) return i - idx;
        }
      }
      if (n.children) {
        for (let i = 0; i < n.children.length; i++) i += f(n.children, i);
      }
      return 0;
    };
    for (let i = 0; i < nodes.length; i++) i += f(nodes, i);
    return result;
  }
  /// Inserts a node into the tree as the last child of 'parent'. Returns the inserted node.
  static append(parent, node) {
    const last = parent.children[parent.children.length - 1];
    if (last) last.rs = node;
    node.ls = last;
    node.rs = null;
    node.parent = parent;
    parent.children.push(node);
    return node;
  }

  /// Removes the passed node from the tree and returns its previous index. Sets
  /// node.parent to null.
  static remove(node) {
    const siblings = node.parent.children;
    const idx = siblings.indexOf(node);
    if (siblings[idx - 1]) siblings[idx - 1].rs = node.rs;
    if (siblings[idx + 1]) siblings[idx + 1].ls = node.ls;
    siblings.splice(idx, 1);
    node.parent = null;
    return idx;
  }
  /// Removes a range of nodes from the tree and returns the index of the first node if
  /// nodes contained more than zero nodes. The `nodes` array must contain a list of direct
  /// siblings ordered from left to right. Sets the removed nodes' parent link to null.
  static remove_range(nodes) {
    const N = nodes.length;
    if (N === 0) return;
    const siblings = nodes[0].parent.children;
    const idx = siblings.indexOf(nodes[0]);
    if (siblings[idx - 1]) siblings[idx - 1].rs = nodes[N - 1].rs;
    if (siblings[idx + N]) siblings[idx + N].ls = nodes[0].ls;
    siblings.splice(idx, N);
    for (let i = 0; i < nodes.length; i++) nodes[i].parent = null;
    return idx;
  }

  /// Replaces n1 with n2 by removing n1 and inserting n2 at n1's old position. If n2 was part of a
  /// tree (had a parent), it will be removed before being inserted at the new position. It is safe
  /// to replace a node with its child.
  /// Returns the inserted node.
  static replace(n1, n2) {
    if (n1 === n2) return n1;
    if (n2.parent) Tree.remove(n2);
    const parent = n1.parent,
      idx = Tree.remove(n1);
    return Tree.insert(parent, idx, n2);
  }

  /// Will switch n1 with n2 if they have the same parent. Otherwise throws an exception.
  static switch_siblings(n1, n2) {
    if (n1.parent != n2.parent)
      throw 'Called switch_siblings on nodes that are no siblings!';
    const p = n1.parent;
    const idx1 = p.children.indexOf(n1);
    const idx2 = p.children.indexOf(n2);
    p.children[idx1] = n2;
    p.children[idx2] = n1;
    let h;
    if (n1.rs == n2) {
      if (n1.ls) n1.ls.rs = n2;
      if (n2.rs) n2.rs.ls = n1;
      n1.rs = n2.rs;
      n2.ls = n1.ls;
      n1.ls = n2;
      n2.rs = n1;
    } else if (n1.ls == n2) {
      if (n1.rs) n1.rs.ls = n2;
      if (n2.ls) n2.ls.rs = n1;
      n1.ls = n2.ls;
      n2.rs = n1.rs;
      n1.rs = n2;
      n2.ls = n1;
    } else {
      if (n1.ls) n1.ls.rs = n2;
      if (n1.rs) n1.rs.ls = n2;
      if (n2.ls) n2.ls.rs = n1;
      if (n2.rs) n2.rs.ls = n1;
      h = n1.ls;
      n1.ls = n2.ls;
      n2.ls = h;
      h = n1.rs;
      n1.rs = n2.rs;
      n2.rs = h;
    }
  }

  /// Will throw an expecption if any node in the tree has invalid value for parent, ls or rs.
  /// `nodes` can either be a single node or an array of nodes. Accordingly, a single node or an array
  /// of nodes is returned.
  static validate(nodes) {
    const check = function (node, parent) {
      if (node.parent != parent) throw 'wrong parent information';
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child.ls != node.children[i - 1]) throw 'wrong ls information';
          if (child.rs != node.children[i + 1]) throw 'wrong rs information';
          check(child, node);
        }
      }
    };
    if (!Array.isArray(nodes)) nodes = [nodes];
    for (let i = 0; i < nodes.length; i++) check(nodes[i], null);
  }

  /// Returns the index of the passed node in its parent node or -1 if it does not
  /// have a parent.
  static get_idx(node) {
    if (node.parent) return node.parent.children.indexOf(node);
    else return -1;
  }

  /// Pass the parent node and then a sequence of children indices to get a specific
  /// child. E.g. for `[A[B,C[D]]]`, Tree.get(t, [0, 1, 0]) will return node `D`.
  /// If the path does not exist, the method returns null.
  static get_child(path, node) {
    for (let i = 0; i < path.length; i++) {
      if (!node.children || node.children.length <= path[i]) return null;
      node = node.children[path[i]];
    }
    return node;
  }

  /// Safe way to get to a nodes anchestors. If a parent does not exist, it will
  /// return null.
  static get_parent(level, node) {
    for (let i = 0; i < level; i++) {
      if (node.parent) node = node.parent;
      else return null;
    }
    return node;
  }
  /// Pass a node to get an array of children-indices from the root to the
  /// passed node. This is the inverse function to Tree.get_child.
  static get_path(node) {
    const path: number[] = [];
    while (node.parent) {
      path.unshift(node.parent.children.indexOf(node));
      node = node.parent;
    }
    return path;
  }
  /// Calls the passed function for the passed node and all its descandents in depth-first order.
  /// TreeNode can either be a single node or an array of nodes.
  static for_each(f, node) {
    const nodes = Array.isArray(node) ? node : [node];
    const traverse = function (node) {
      f(node);
      if (node.children)
        for (let i = 0; i < node.children.length; i++)
          traverse(node.children[i]);
    };
    for (let i = 0; i < nodes.length; i++) traverse(nodes[i]);
  }
  /// Calls the passed function for each of the passed nodes and their anchestors, depth-first.
  /// The results are stored in an array that is returned. TreeNode can either be a single node or
  /// an array of nodes.
  // eslint-disable-next-line no-unused-vars
  static map<T>(f: (node: TreeNode) => T, node: TreeNode | TreeNode[]) {
    const nodes = Array.isArray(node) ? node : [node];
    const res: T[] = [];
    const traverse = function (node: TreeNode) {
      res.push(f(node));
      if (node.children)
        for (let i = 0; i < node.children.length; i++)
          traverse(node.children[i]);
    };
    for (let i = 0; i < nodes.length; i++) traverse(nodes[i]);
    return res;
  }
  /// Returns an array of all nodes for which the passed selector function returned true. Traverses
  /// the nodes depth-first. The passed node can either be a single node or an array of nodes.
  static filter(selector, node) {
    const result: TreeNode[] = [];
    const nodes = Array.isArray(node) ? node : [node];
    const f = function (node) {
      if (selector(node)) result.push(node);
      if (node.children)
        for (let i = 0; i < node.children.length; i++) f(node.children[i]);
    };
    for (let i = 0; i < nodes.length; i++) f(nodes[i]);
    return result;
  }
  /// Returns an array of all nodes in the tree of the passed root node. The root node is included.
  /// Traverses the nodes depth-first. The passed node can either be a single node or an array of
  /// nodes.
  static select_all(node) {
    return Tree.filter(function () {
      return true;
    }, node);
  }
  /// Returns the first node in the passed node or its decandents for that the selector function
  /// returns true. Traverses depth-first. TreeNode can either be a single node or an array of nodes.
  /// If no nodes matches, returns null.
  static select_first(selector, node) {
    const f = function (node) {
      let curr = node;
      for (;;) {
        if (selector(curr)) return curr;
        if (curr.children && curr.children[0]) {
          curr = curr.children[0];
          continue;
        }
        if (curr === node) return null;
        while (!curr.rs) {
          curr = curr.parent;
          if (curr === node) return null;
        }
        curr = curr.rs;
      }
    };
    const nodes = Array.isArray(node) ? node : [node];
    for (let i = 0; i < nodes.length; i++) {
      const n = f(nodes[i]);
      if (n) return n;
    }
    return null;
  }
  /// Returns the closest common anchestor of the passed nodes.
  static get_cca(nodes) {
    const paths = nodes.map(function (node) {
      return Tree.get_path(node);
    });
    const same = function (len) {
      const val = paths[0][len];
      for (let i = 0; i < paths.length; i++) {
        if (paths[i].length <= len + 1) return false; // no need to look further if we are at a leaf already
        if (paths[i][len] !== val) return false;
      }
      return true;
    };
    let cpl = 0; // common path length
    while (same(cpl)) cpl++;
    const d = paths[0].length - cpl;
    let n = nodes[0];
    for (let i = 0; i < d; i++) n = n.parent;
    return n;
  }
  /// Returns an array of all leaf nodes of the node array or single node passed.
  static get_leaf_nodes(node) {
    return Tree.filter(function (n) {
      return !(n.children && n.children.length);
    }, node);
  }
  /// Retruns true if the node is top-level in the tree (its parent is the Tree object).
  static is_root(node) {
    return !node.parent;
  }
  /// Retruns true if the passed node array is a proper node range, which is the
  /// case only if they are all siblings and ordered from left to right.
  static is_range(nodes) {
    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i - 1].rs !== nodes[i]) return false;
    }
    return true;
  }
  /// Returns the tree that a node belongs to by following the .parent references. Returns
  /// null if the top-most parent is not a Tree.
  static get_root(node) {
    while (node.parent) node = node.parent;
    return node;
  }
  /// Returns an array of all nodes that have the passed value in their .value field. Seaches on
  /// the passed array of nodes or single node depth-first.
  static get_by_value(value, node) {
    return Tree.filter(function (n) {
      return n.value === value;
    }, node);
  }
  /// Returns the first node with the passed id or null if no node has the id. Seaches on
  /// the passed array of nodes or single node depth-first.
  static get_by_id(id, node) {
    return Tree.select_first(function (n) {
      return n.id === id;
    }, node);
  }
  static uid = uid;
  static version = '1.3.7';
  static Node = TreeNode;
}
