/// Copyright by Erik Weitnauer, 2013.

/// testing with nodeunit
var Tree   = require('../dist/tree.js').Tree;

exports['parse'] = function(test) {
  var t0 = Tree.parse('');
  var t01 = Tree.parse('A');
  var t02 = Tree.parse('A,B');
  var t1 = Tree.parse('[,]');
  var t2 = Tree.parse('[A,B]');
  var t3 = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');

  test.equals(t0.children.length, 0);
  test.equals(t01.children.length, 0);
  test.equals(t01.value, 'A');
  test.equals(t02.length, 2);
  test.equals(t02[0].value, 'A');
  test.equals(t02[0].rs.value, 'B');
  test.equals(t02[0].parent, undefined);
  test.equals(t02[1].value, 'B');
  test.equals(t02[1].ls.value, 'A');
  test.equals(t02[1].parent, undefined);

  test.equals(t1.value, '');
  test.equals(t1.children.length, 2);
  test.equals(t1.children[0].value, '');
  test.equals(t1.children[1].value, '');

  test.equals(t2.children.length, 2);
  test.equals(t2.children[0].value, 'A');
  test.equals(t2.children[1].value, 'B');
  test.equals(t2.children[0].ls, null);
  test.equals(t2.children[1].rs, null);
  test.equals(t2.children[0].rs.value, 'B');
  test.equals(t2.children[1].ls.value, 'A');
  test.equals(t2.children[0].parent, t2);
  test.equals(t2.children[1].parent, t2);
  test.equals(t2.children[0].children.length, 0);
  test.equals(t2.children[1].children.length, 0);

  test.equals(t3.children.length, 3);
  test.equals(t3.children[0].children.length, 2);
  test.equals(t3.children[1].children.length, 0);
  test.equals(t3.children[2].children.length, 1);
  test.equals(t3.children[2].children[0].children.length, 1);
  test.equals(t3.children[2].children[0].children[0].children.length, 0);

  test.done();
}

exports['stringify'] = function(test) {
  test.equals(Tree.stringify(Tree.parse('A')), 'A');
  test.equals(Tree.stringify(Tree.parse('[]')), '[]');
  test.equals(Tree.stringify(Tree.parse('A,B')), 'A,B');
  test.equals(Tree.stringify(Tree.parse('[A[A1,A2],B,C[C1[C11]]]')), '[A[A1,A2],B,C[C1[C11]]]');

  test.equals(Tree.parse('[A[A1,A2],B,C[C1[C11]]]').stringify(), '[A[A1,A2],B,C[C1[C11]]]');

  test.done();
}

exports['uid'] = function(test) {
  var ids = [], hexp = /[\da-fA-F]{16}/;
  for (var i=0; i<500; i++) {
    var id = Tree.uid();
    test.ok(ids.indexOf(id)===-1);
    test.ok(hexp.test(id));
    ids.push(id);
  }

  test.done();
}

exports['validate'] = function(test) {
  var t1 = Tree.parse('');
  test.doesNotThrow(function() {Tree.validate(t1)});

  var t2 = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');
  test.doesNotThrow(function() {Tree.validate(t2)});
  test.doesNotThrow(function() {t2.validate()});

  var t2b = Tree.parse('A[A1,A2],B,C[C1[C11]]');
  test.doesNotThrow(function() {Tree.validate(t2b)});

  var t3 = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');
  t3.children[2].children[0].children[0].parent = null;
  test.throws(function() {Tree.validate(t3)});

  var t3b = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');
  t3b.children[2].children[0].children[0].parent = t3b.children[2];
  test.throws(function() {Tree.validate(t3b)});

  var t4 = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');
  t4.children[0].children[0].rs = null;
  test.throws(function() {Tree.validate(t4)});

  var t5 = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');
  t5.children[0].children[1].ls = null;
  test.throws(function(){Tree.validate(t5)});

  var t6 = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');
  t6.children[0].children = t6.children[0].children.slice(1);
  test.throws(function(){Tree.validate(t6)});
  test.throws(function(){t6.validate()});

  var t6b = Tree.parse('A[A1,A2],B,C[C1[C11]]');
  t6b[0].children = t6b[0].children.slice(1);
  test.throws(function(){Tree.validate(t6b)});

  test.done();
}

exports['insert_range'] = function(test) {
  var t0 = Tree.parse('');
  Tree.insert_range(t0, 0, Tree.parse('[a,b]').children);
  test.equals(Tree.stringify(t0), '[a,b]');
  test.doesNotThrow(function(){Tree.validate(t0)});

  var t1 = Tree.parse('[A,B]');
  Tree.insert_range(t1, 1, Tree.parse('[a,b,c]').children.slice(1,3));
  test.equals(Tree.stringify(t1), '[A,b,c,B]');
  test.doesNotThrow(function(){Tree.validate(t1)});

  var t1b = Tree.parse('[A,B]');
  t1b.insert_range(1, Tree.parse('[a,b,c]').children.slice(1,3));
  test.equals(t1b.stringify(), '[A,b,c,B]');
  test.doesNotThrow(function(){t1b.validate()});

  var t2 = Tree.parse('[A,B]');
  Tree.insert_range(t2, 1, []);
  test.equals(Tree.stringify(t2), '[A,B]');
  test.doesNotThrow(function(){Tree.validate(t2)});

  test.done();
}

exports['append_range'] = function(test) {
  var t0 = Tree.parse('');
  Tree.append_range(t0, Tree.parse('[a,b]').children);
  test.equals(Tree.stringify(t0), '[a,b]');
  test.doesNotThrow(function(){Tree.validate(t0)});

  var t1 = Tree.parse('[A,B]');
  Tree.append_range(t1, Tree.parse('[a,b,c]').children.slice(1,3));
  test.equals(Tree.stringify(t1), '[A,B,b,c]');
  test.doesNotThrow(function(){Tree.validate(t1)});

  var t1b = Tree.parse('[A,B]');
  t1b.append_range(Tree.parse('[a,b,c]').children.slice(1,3));
  test.equals(t1b.stringify(), '[A,B,b,c]');
  test.doesNotThrow(function(){t1b.validate()});

  var t2 = Tree.parse('[A,B]');
  Tree.append_range(t2, []);
  test.equals(Tree.stringify(t2), '[A,B]');
  test.doesNotThrow(function(){Tree.validate(t2)});

  test.done();
}

exports['remove_range'] = function(test) {
  test.doesNotThrow(function(){Tree.remove_range([])});

  var t1 = Tree.parse('[A,B,C]');
  var n = t1.children[1];
  var idx = Tree.remove_range([t1.children[1]]);
  test.equals(Tree.stringify(t1), '[A,C]');
  test.equals(idx, 1);
  test.equals(n.parent, null);
  test.doesNotThrow(function(){Tree.validate(t1)});

  var t2 = Tree.parse('[A,B[a,b],C,D]');
  idx = Tree.remove_range(t2.children.slice(0,3));
  test.equals(Tree.stringify(t2), '[D]');
  test.equals(idx, 0);
  test.doesNotThrow(function(){Tree.validate(t2)});

  var t2b = Tree.parse('[A,B[a,b],C,D]');
  idx = t2b.remove_range(t2b.children.slice(0,3));
  test.equals(t2b.stringify(), '[D]');
  test.equals(idx, 0);
  test.doesNotThrow(function(){t2b.validate()});

  test.done();
}

exports['insert'] = function(test) {
  var t0 = Tree.parse('');
  Tree.insert(t0, 0, {value:'A'});
  test.equals(Tree.stringify(t0), '[A]');
  test.doesNotThrow(function(){Tree.validate(t0)});

  var t1 = Tree.parse('[A,B]');
  Tree.insert(t1, 1, {value: 'AB'});
  test.equals(Tree.stringify(t1), '[A,AB,B]');
  test.doesNotThrow(function(){Tree.validate(t1)});

  var t1b = Tree.parse('[A,B]');
  t1b.insert(1, {value: 'AB'});
  test.equals(Tree.stringify(t1b), '[A,AB,B]');
  test.doesNotThrow(function(){Tree.validate(t1b)});

  test.done();
}

exports['append'] = function(test) {
  var t0 = Tree.parse('');
  Tree.append(t0, {value:'A'});
  test.equals(Tree.stringify(t0), '[A]');
  test.doesNotThrow(function(){Tree.validate(t0)});

  var t1 = Tree.parse('[A[a,b],B]');
  Tree.append(t1.children[0], {value: 'c'});
  test.equals(Tree.stringify(t1), '[A[a,b,c],B]');
  test.doesNotThrow(function(){Tree.validate(t1)});

  var t1b = Tree.parse('[A[a,b],B]');
  t1b.children[0].append({value: 'c'});
  test.equals(Tree.stringify(t1b), '[A[a,b,c],B]');
  test.doesNotThrow(function(){Tree.validate(t1b)});

  test.done();
}

exports['remove'] = function(test) {
  var idx;

  var t0 = Tree.parse('[A,B,C]');
  var n = t0.children[1];
  idx = Tree.remove(n);
  test.equals(n.parent, null);
  test.equals(Tree.stringify(t0), '[A,C]');
  test.doesNotThrow(function(){Tree.validate(t0)});
  test.equals(idx, 1);

  var t1 = Tree.parse('[A]');
  idx = Tree.remove(t1.children[0]);
  test.equals(Tree.stringify(t1), '');
  test.doesNotThrow(function(){Tree.validate(t1)});
  test.equals(idx, 0);

  var t2 = Tree.parse('[A,B[a,b],C]')
  idx = Tree.remove(t2.children[1].children[1]);
  test.equals(Tree.stringify(t2), '[A,B[a],C]');
  test.doesNotThrow(function(){Tree.validate(t2)});

  var t2b = Tree.parse('[A,B[a,b],C]')
  idx = t2b.children[1].children[1].remove();
  test.equals(Tree.stringify(t2b), '[A,B[a],C]');
  test.doesNotThrow(function(){Tree.validate(t2b)});

  test.done();
}

exports['replace'] = function(test) {
  var t0 = Tree.parse('[A]');
  Tree.replace(t0.children[0], {value: 'B', children:[]});
  test.equals(Tree.stringify(t0), '[B]');
  test.doesNotThrow(function(){Tree.validate(t0)});


  var t1 = Tree.parse('[A[a,b],B]');
  Tree.replace(t1.children[0], t1.children[0].children[1]);
  test.equals(Tree.stringify(t1), '[b,B]');
  test.doesNotThrow(function(){Tree.validate(t1)});

  var t1b = Tree.parse('[A[a,b],B]');
  t1b.children[0].replace_with(t1b.children[0].children[1]);
  test.equals(Tree.stringify(t1b), '[b,B]');
  test.doesNotThrow(function(){Tree.validate(t1b)});

  var t2 = Tree.parse('[A,B]');
  var t3 = Tree.parse('[C[a],D]');
  Tree.replace(t2.children[1], t3.children[0]);
  test.equals(Tree.stringify(t2), '[A,C[a]]');
  test.equals(Tree.stringify(t3), '[D]');
  test.doesNotThrow(function(){Tree.validate(t2)});
  test.doesNotThrow(function(){Tree.validate(t3)});

  var t4 = Tree.parse('[A,B]');
  Tree.replace(t4.children[0], t4.children[0]);
  test.equals(Tree.stringify(t4), '[A,B]');
  test.doesNotThrow(function(){Tree.validate(t4)});

  test.done();
}

exports['switch_siblings'] = function(test) {
  var t0 = Tree.parse('[A,B,C]');
  Tree.switch_siblings(t0.children[0], t0.children[2]);
  test.equals(Tree.stringify(t0), '[C,B,A]');
  test.doesNotThrow(function(){Tree.validate(t0)});

  var t1 = Tree.parse('[A,B,C]');
  Tree.switch_siblings(t1.children[2], t1.children[0]);
  test.equals(Tree.stringify(t1), '[C,B,A]');
  test.doesNotThrow(function(){Tree.validate(t1)});

  var t2 = Tree.parse('[A,B,C]');
  Tree.switch_siblings(t2.children[1], t2.children[2]);
  test.equals(Tree.stringify(t2), '[A,C,B]');
  test.doesNotThrow(function(){Tree.validate(t2)});

  var t2b = Tree.parse('[A,B,C]');
  t2b.children[1].switch_with_sibling(t2b.children[2]);
  test.equals(Tree.stringify(t2b), '[A,C,B]');
  test.doesNotThrow(function(){Tree.validate(t2b)});

  var t3 = Tree.parse('[A,B,C]');
  Tree.switch_siblings(t3.children[1], t3.children[0]);
  test.equals(Tree.stringify(t3), '[B,A,C]');
  test.doesNotThrow(function(){Tree.validate(t3)});

  var t4 = Tree.parse('[A[b]]');
  test.throws(function() {Tree.switch_siblings(t4.children[0], t4.children[0].children[0])});

  test.done();
}

exports['for_each'] = function(test) {
  var t0 = Tree.parse('');
  var res = [];
  Tree.for_each(function (n) { res.push(n.value) }, t0.children);
  test.equals(res.length, 0);

  var t1 = Tree.parse('A,B');
  res = [];
  Tree.for_each(function (n) { res.push(n.value) }, t1);
  test.deepEqual(res, ['A','B']);

  var t1b = Tree.parse('A[B,C]');
  res = [];
  t1b.for_each(function (n) { res.push(n.value) });
  test.deepEqual(res, ['A','B', 'C']);

  var t2 = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');
  res = [];
  Tree.for_each(function (n) { res.push(n.value) }, t2.children);
  test.deepEqual(res, ['A','A1','A2','B','C','C1','C11']);
  res = [];
  Tree.for_each(function (n) { res.push(n.value) }, t2.children[0]);
  test.deepEqual(res, ['A','A1','A2']);

  test.done();
}

exports['map'] = function(test) {
  var f = function(node) { return node.value };

  var t0 = Tree.parse('');
  var res = Tree.map(f, t0.children);
  test.equals(res.length, 0);

  var t1 = Tree.parse('A,B');
  res = Tree.map(f, t1);
  test.deepEqual(res, ['A','B']);

  var t1b = Tree.parse('A[B,C]');
  res = t1b.map(f);
  test.deepEqual(res, ['A','B', 'C']);

  var t2 = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');
  res = Tree.map(f, t2.children);
  test.deepEqual(res, ['A','A1','A2','B','C','C1','C11']);
  res = Tree.map(f, t2.children[0]);
  test.deepEqual(res, ['A','A1','A2']);

  test.done();
}

exports['filter'] = function(test) {
  var true_fn = function() {return true};
  var t0 = Tree.parse('');
  var res = Tree.filter(true_fn, t0.children);
  test.equals(res.length, 0);

  var t1 = Tree.parse('A,B');
  res = Tree.filter(true_fn, t1);
  res = res.map(function (n) { return n.value });
  test.deepEqual(res, ['A','B']);

  var t1b = Tree.parse('A[B,C]');
  res = t1b.filter(true_fn);
  res = res.map(function (n) { return n.value });
  test.deepEqual(res, ['A','B', 'C']);

  var t2 = Tree.parse('[A[A1,A2],BB,C[C1[C11]]]');
  res = Tree.filter(function (n) { return n.value.length == 1 }, t2.children);
  res = res.map(function (n) { return n.value });
  test.deepEqual(res, ['A','C']);
  res = Tree.filter(function (n) { return n.value.length == 2 }, t2.children[0]);
  res = res.map(function (n) { return n.value });
  test.deepEqual(res, ['A1','A2']);

  test.done();
}

exports['filterRange'] = function(test) {
  var true_fn = function() {return true};
  var ranges_to_arr = function(ranges) {
    return ranges.map(function (range) {
      return range.map(function(n) { return n.value }).join('')
    });
  }
  var t0 = Tree.parse('');
  var res = Tree.filterRange(true_fn, t0.children);
  test.equals(res.length, 0);

  var t1 = Tree.parse('A,B,C');
  res = Tree.filterRange(true_fn, t1);
  res = ranges_to_arr(res);
  test.deepEqual(res, ['A', 'AB', 'ABC', 'B', 'BC', 'C']);

  var t1b = Tree.parse('A[B,C]');
  res = t1b.filterRange(true_fn);
  res = ranges_to_arr(res);
  test.deepEqual(res, ['A', 'B', 'BC', 'C']);

  var t2 = Tree.parse('[A[a,b],B,C[x[y]]]');
  res = Tree.filterRange(function (ns) { return ns.length == 2 }, t2.children);
  res = ranges_to_arr(res);
  test.deepEqual(res, ['AB', 'ab', 'BC']);
  res = Tree.filterRange(function (ns) { return ns[0].value == 'x' }, t2.children);
  res = ranges_to_arr(res);
  test.deepEqual(res, ['x']);
  res = Tree.filterRange(function () { return false }, t2.children);
  test.deepEqual(res, []);

  var t3 = Tree.parse('[a[b,c],d,e,f]');
  res = Tree.filterRange(function (ns) { return ns.length == 2 }, t3.children, false);
  res = ranges_to_arr(res);
  test.deepEqual(res, ['ad', 'bc', 'de', 'ef']);
  var res_no_overlap = Tree.filterRange(function (ns) { return ns.length == 2 }, t3.children, true);
  res_no_overlap = ranges_to_arr(res_no_overlap);
  test.deepEqual(res_no_overlap, ['ad', 'ef']);

  test.done();
}

exports['select_all'] = function(test) {
  var t0 = Tree.parse('');
  var res = Tree.select_all(t0.children);
  test.equals(res.length, 0);

  var t1 = Tree.parse('[A[A1,A2],B,C[C1[C11]]]');
  res = Tree.select_all(t1.children);
  res = res.map(function (n) { return n.value }).join(' ');
  test.deepEqual(res, 'A A1 A2 B C C1 C11');

  var t1b = Tree.parse('X[A[A1,A2],B,C[C1[C11]]]');
  res = t1b.select_all();
  res = res.map(function (n) { return n.value }).join(' ');
  test.deepEqual(res, 'X A A1 A2 B C C1 C11');

  test.done();
}

exports['select_first'] = function(test) {
  var true_fn = function() {return true};
  var false_fn = function() {return false};
  var t0 = Tree.parse('');
  var res = Tree.select_first(true_fn, t0.children);
  test.equals(res, null);

  var t1 = Tree.parse('A,B');
  res = Tree.select_first(true_fn, t1);
  test.equals(res, t1[0]);

  var t1b = Tree.parse('[B,C]');
  res = t1b.select_first(function (n) { return n.value });
  test.equals(res, t1b.children[0]);

  var t2 = Tree.parse('[A]');
  res = Tree.select_first(false_fn, t2.children[0]);
  test.equals(res, null);

  var t3 = Tree.parse('[A[A1,A2],BB,C[C1[C11]]]');
  res = Tree.select_first(function (n) { return n.value.length == 3 }, t3.children);
  test.equals(res, t3.children[2].children[0].children[0]);
  res = Tree.select_first(false_fn, t3.children[0]);
  test.equals(res, null);

  test.done();
}

exports['clone'] = function(test) {
  var n0 = Tree.parse('[A]').children[0];
  n0.id = Tree.uid();
  var c0 = Tree.clone(n0);
  test.notEqual(c0, n0);
  test.notEqual(c0.id, n0.id);
  test.equals(c0.value, n0.value);
  c0 = Tree.clone(n0, true);
  test.equals(c0.id, n0.id);

  var f = function(n) { return n.value }

  var n1 = Tree.parse('[A,B[a[1,2],b[1[1]],c],C]').children[1];
  var c1 = Tree.clone(n1);
  test.equals(c1.ls, null);
  test.equals(c1.rs, null);
  test.equals(c1.parent, null);
  test.notEqual(c1,n1);
  test.deepEqual(Tree.map(f,n1), Tree.map(f,c1));

  var n1b = Tree.parse('[A,B[a[1,2],b[1[1]],c],C]').children[1];
  var c1b = n1b.clone();
  test.equals(c1b.ls, null);
  test.equals(c1b.rs, null);
  test.equals(c1b.parent, null);
  test.notEqual(c1b,n1b);
  test.deepEqual(Tree.map(f,n1b), Tree.map(f,c1b));

  var n2 = Tree.parse('[A,B[a[1,2],b[1[1]],c],C]').children;
  var c2 = Tree.clone(n2);
  test.equals(c2.length, 3)
  test.notEqual(c2,n2);
  test.strictEqual(c2[0].rs, c2[1], 'correct right sibling');
  test.strictEqual(c2[1].rs, c2[2], 'correct right sibling');
  test.strictEqual(c2[2].rs, undefined, 'correct right sibling');
  test.strictEqual(c2[0].ls, undefined, 'correct left sibling');
  test.strictEqual(c2[1].ls, c2[0], 'correct left sibling');
  test.strictEqual(c2[2].ls, c2[1], 'correct left sibling');

  test.deepEqual(Tree.map(f,n2), Tree.map(f,c2));

  test.done();
}

exports['get_1to1_mapping_between'] = function(test) {
  function set_ids(nodes) {
    Tree.for_each(function(node) { node.id = node.value }, nodes);
    return nodes;
  }
  var map;
  var n0 = set_ids(Tree.parse('[A]').children[0]);
  var c0 = Tree.parse('[A]').children[0];
  map = Tree.get_1to1_mapping_between(n0, c0);
  test.strictEqual(map.A[0], c0);

  var n1 = Tree.parse('O[A,B[1,2],C]');
  var c1 = Tree.parse('O[A,B[1,2],C]');
  var mappings = n1.map(function(node) {
    return {id: node.id, target: c1.get_child(node.get_path())};
  });
  map = n1.get_1to1_mapping_to(c1);
  mappings.forEach(function(mapping) {
    test.strictEqual(map[mapping.id][0], mapping.target);
  });

  var ns = set_ids(Tree.parse('[A,B[b],C]').children);
  var cs = Tree.clone(ns);
  map = Tree.get_1to1_mapping_between(ns, cs);
  test.strictEqual(map.A.length, 1);
  test.strictEqual(map.A[0], cs[0]);
  test.strictEqual(map.B[0], cs[1]);
  test.strictEqual(map.B.length, 1);
  test.strictEqual(map.b[0], cs[1].children[0]);
  test.strictEqual(map.b.length, 1);
  test.strictEqual(map.C[0], cs[2]);
  test.strictEqual(map.C.length, 1);

  var ns2 = Tree.parse('[A]').children;
  var cs2 = Tree.parse('[A,B]').children;
  test.throws(function() { Tree.get_1to1_mapping_between(ns2, cs2) }
             ,"structures don't match");

  var ns3 = Tree.parse('[A]').children;
  var cs3 = Tree.parse('[A[B]]').children;
  test.throws(function() { Tree.get_1to1_mapping_between(ns3, cs3) }
             ,"structures don't match");

  var ns4 = set_ids(Tree.parse('[A[B],C]').children);
  var cs4 = Tree.parse('[A,C,D]').children;
  map = Tree.get_1to1_mapping_between(ns4, cs4, false);
  test.strictEqual(map.A.length, 1);
  test.strictEqual(map.A[0], cs4[0]);
  test.strictEqual(map.B.length, 0);
  test.strictEqual(map.C[0], cs4[1]);
  test.strictEqual(map.C.length, 1);

  var ns5 = set_ids(Tree.parse('[A,A]').children);
  test.throws(function() { Tree.get_1to1_mapping_between(ns5, ns5) }
             ,"duplicate ids");

  test.done();
}

exports['get_mapping_between'] = function(test) {
  function set_ids(nodes) {
    Tree.for_each(function(node) { node.id = node.value }, nodes);
    return nodes;
  }
  var map;
  var n0 = set_ids(Tree.parse('[A]').children[0]);
  var c0 = Tree.parse('[A]').children[0];
  map = Tree.get_mapping_between(n0, c0);
  test.strictEqual(map.A[0], c0);
  test.equals(map.A.length, 1);

  var n1 = Tree.parse('O[A,B[1,2],C]');
  var c1 = Tree.parse('O[A,B[1,2],C]');
  var mappings = n1.map(function(node) {
    return {id: node.id, target: c1.get_child(node.get_path())};
  });
  map = n1.get_mapping_to(c1);
  mappings.forEach(function(mapping) {
    test.strictEqual(map[mapping.id][0], mapping.target);
    test.equals(map[mapping.id].length, 1);
  });

  var ns = set_ids(Tree.parse('[A,B]')).children;
  var cs = set_ids(Tree.parse('[A[a[b],c],B]')).children;
  map = Tree.get_mapping_between(ns, cs);
  test.equals(map.A.length, 4);
  test.strictEqual(map.A[0], cs[0]);
  test.strictEqual(map.A[1], cs[0].children[0]);
  test.strictEqual(map.A[2], cs[0].children[0].children[0]);
  test.strictEqual(map.A[3], cs[0].children[1]);
  test.equals(map.B.length, 1);
  test.strictEqual(map.B[0], cs[1]);

  map = Tree.get_mapping_between(cs, ns);
  test.equals(map.A.length, 1);
  test.strictEqual(map.A[0], ns[0]);
  test.equals(map.a.length, 1);
  test.strictEqual(map.a[0], ns[0]);
  test.equals(map.b.length, 1);
  test.strictEqual(map.b[0], ns[0]);
  test.equals(map.c.length, 1);
  test.strictEqual(map.c[0], ns[0]);
  test.equals(map.B.length, 1);
  test.strictEqual(map.B[0], ns[1]);

  var ns2 = Tree.parse('[A]').children;
  var cs2 = Tree.parse('[A,B]').children;
  test.throws(function() { Tree.get_mapping_between(ns2, cs2) }
             ,"structures don't match");

  var ns3 = set_ids(Tree.parse('[A,A]').children);
  test.throws(function() { Tree.get_mapping_between(ns3, ns3) }
             ,"duplicate ids");

  test.done();
}

exports['get_by_value'] = function(test) {
  var t1 = Tree.parse('[A,B[B,b],B,C[C[x,y,z[1,2]]]]')

  var r0 = Tree.get_by_value('A', t1.children);
  test.equals(r0.length, 1);
  test.equals(r0[0], t1.children[0]);

  var r1 = Tree.get_by_value('B', t1.children);
  test.equals(r1.length, 3);
  test.equals(r1[0], t1.children[1]);
  test.equals(r1[1], t1.children[1].children[0]);
  test.equals(r1[2], t1.children[2]);

  var r1b = t1.get_by_value('B');
  test.equals(r1b.length, 3);
  test.equals(r1b[0], t1.children[1]);
  test.equals(r1b[1], t1.children[1].children[0]);
  test.equals(r1b[2], t1.children[2]);

  var r2 = Tree.get_by_value('ab', t1.children);
  test.equals(r2.length, 0);

  var r3 = Tree.get_by_value('', t1.children);
  test.equals(r3.length, 0);

  test.done()
}

exports['get_by_id'] = function(test){
  var t1 = Tree.parse('[A,B[a,b],C');
  Tree.for_each(function (n) { n.id = '#'+n.value }, t1);

  test.equals(Tree.get_by_id('#B', t1), t1.children[1]);
  test.equals(Tree.get_by_id('#b', t1), t1.children[1].children[1]);
  test.equals(t1.get_by_id('#b'), t1.children[1].children[1]);
  test.equals(Tree.get_by_id('D', t1), null);

  test.done()
}

exports['get_child'] = function(test){
  var t1 = Tree.parse('[A,B[a,b],C,D[j[x,y,z[1,2]]]]')
  test.equals(Tree.get_child([0],t1).value, 'A')
  test.equals(Tree.get_child([1],t1).value, 'B')
  test.equals(Tree.get_child([1, 1],t1).value, 'b')
  test.equals(Tree.get_child([3,0,2,1],t1).value, '2')
  test.equals(t1.get_child([3,0,2,1]).value, '2')
  test.equals(Tree.get_child([4],t1), null);
  test.equals(Tree.get_child([1,3],t1), null);
  test.equals(Tree.get_child([1,0,0],t1), null);

  test.done()
}

exports['get_parent'] = function(test){
  var t1 = Tree.parse('[A,B[a,b],C,D[j[x,y,z[1,2]]]]')
  var n = t1.get_child([3,0,2,1]);
  test.equals(Tree.get_parent(0, n).value, '2');
  test.equals(n.get_parent(1).value, 'z');
  test.equals(n.get_parent(2).value, 'j');
  test.equals(n.get_parent(3).value, 'D');
  test.equals(n.get_parent(4).value, '');
  test.equals(n.get_parent(5), null);

  test.done()
}

exports['get_path'] = function(test){
  var t1 = Tree.parse('[A,B[a,b],C,D[j[x,y,z[1,2]]]]')

  test.deepEqual(Tree.get_path(t1.children[0]), [0])
  test.deepEqual(Tree.get_path(t1.children[1]), [1])
  test.deepEqual(Tree.get_path(t1.children[1].children[1]), [1,1])
  test.deepEqual(Tree.get_path(Tree.get_child([3,0,2,1],t1)), [3,0,2,1])
  test.deepEqual(t1.get_child([3,0,2,1]).get_path(), [3,0,2,1])
  test.deepEqual(Tree.get_path('blubb'), []);

  test.done()
}

exports['get_leaf_nodes'] = function(test){
  var t1 = Tree.parse('[A,B[a,b],C,D[j[x,y,z[1,2]]]]')
  var t2 = Tree.parse('[A,B,C]')
  var t3 = Tree.parse('[]')
  var f = function (n) { return n.value }
  test.deepEqual(Tree.get_leaf_nodes(t1).map(f), ['A', 'a', 'b', 'C', 'x', 'y', '1', '2'])
  test.deepEqual(Tree.get_leaf_nodes(t2).map(f), ['A', 'B', 'C'])
  test.deepEqual(t2.get_leaf_nodes().map(f), ['A', 'B', 'C'])
  test.deepEqual(Tree.get_leaf_nodes(t3).map(f), [''])
  test.done()
}

exports['nodes_to_range'] = function (test) {
  var t1 = Tree.parse('[A,B[a,b],C,D[j[x,y,z[1,2]]]]');

  var r1 = Tree.nodes_to_range([t1.children[0]]);
  test.equals(r1.length, 1);
  test.equals(r1[0], t1.children[0]);

  var r2 = Tree.nodes_to_range([t1.children[1], t1.children[3]]);
  test.equals(r2.length, 3);
  test.equals(r2[0], t1.children[1]);
  test.equals(r2[1], t1.children[2]);
  test.equals(r2[2], t1.children[3]);

  var r3 = Tree.nodes_to_range([Tree.get_child([3,0,1],t1)
                               ,Tree.get_child([3,0,2,0],t1)
                               ,Tree.get_child([3,0,2,1],t1)]);
  test.equals(r3.length, 2);
  test.equals(r3[0], Tree.get_child([3,0,1],t1));
  test.equals(r3[1], Tree.get_child([3,0,2],t1));

  var r4 = Tree.nodes_to_range([Tree.get_child([1,0],t1)
                               ,Tree.get_child([3,0,2,1],t1)]);
  test.equals(r4.length, 3);
  test.equals(r4[0], t1.children[1]);
  test.equals(r4[1], t1.children[2]);
  test.equals(r4[2], t1.children[3]);

  var r5 = Tree.nodes_to_range([t1.children[1], t1.children[1].children[0]]);
  test.equals(r5.length, 1);
  test.equals(r5[0], t1.children[1]);

  var t2 = Tree.parse('[A[a,b,c,d]]');
  var r6 = Tree.nodes_to_range([t2.get_child([0,0]), t2.get_child([0,2])]);
  test.equals(r6.length, 3);

  var t3 = Tree.parse('[a,b,c,d,e,f]');
  var r7 = Tree.nodes_to_range([t3.children[4], t3.children[5]]);
  test.equals(r7.length, 2);
  test.equals(r7[0].value, 'e');
  test.equals(r7[1].value, 'f');

  test.done();
}

exports['get_cca'] = function(test) {
  var t1 = Tree.parse('[A,B[a,b],C,D[j[x,y,z[1,2]]]]');

  var a = Tree.get_child([1,0], t1);
  var b = Tree.get_child([1,1], t1);
  var B = Tree.get_child([1], t1);
  var j = Tree.get_child([3,0], t1);
  var x = Tree.get_child([3,0,0], t1);
  var _2 = Tree.get_child([3,0,2,1], t1);
  test.equals(Tree.get_cca([a]), B);
  test.equals(Tree.get_cca([a,b]), B);
  test.equals(Tree.get_cca([x,_2]), j);
  test.equals(Tree.get_cca([b,_2]), t1);

  test.done();
}

exports['is_range'] = function(test) {
  var t1 = Tree.parse('[A,B[a,b],C,D]');
  var A = t1.children[0]
    , B = t1.children[1]
    , C = t1.children[2]
    , D = t1.children[3]
    , a = B.children[0]
    , b = B.children[1];
  test.ok(Tree.is_range([A,B,C,D]));
  test.ok(Tree.is_range([C]));
  test.ok(!Tree.is_range([D,C]));
  test.ok(Tree.is_range([a,b]));
  test.ok(!Tree.is_range([B,a]));
  test.done();
}

exports['is_root'] = function(test) {
  var t1 = Tree.parse('A,B[a]');
  test.ok(Tree.is_root(t1[0]));
  test.ok(Tree.is_root(t1[1]));
  test.ok(t1[1].is_root());
  test.ok(!Tree.is_root(t1[1].children[0]));
  test.ok(!t1[1].children[0].is_root());

  test.done();
}

exports['get_root'] = function (test) {
  var t1 = Tree.parse('[A,B[a]]');
  test.equals(Tree.get_root(t1.children[0]), t1);
  test.equals(Tree.get_root(t1.children[1]), t1);
  test.equals(Tree.get_root(t1.children[1].children[0]), t1);
  test.equals(t1.children[1].children[0].get_root(), t1);

  test.done();
}

exports['get_idx'] = function (test) {
  var t1 = Tree.parse('[A,B[a],C]');
  test.equals(Tree.get_idx(t1.children[0]), 0);
  test.equals(t1.children[2].get_idx(), 2);
  test.equals(t1.children[1].children[0].get_idx(), 0);
  test.equals(Tree.get_idx(t1), -1);
  var c = t1.children[1];
  c.remove();
  test.equals(c.get_idx(), -1);

  test.done();
}
