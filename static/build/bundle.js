
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function circIn(t) {
        return 1.0 - Math.sqrt(1.0 - t * t);
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/UI/Error.svelte generated by Svelte v3.16.5 */

    const { Error: Error_1 } = globals;
    const file = "src/UI/Error.svelte";

    // (18:0) {#if show}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let h4;
    	let t2;
    	let div1_intro;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "X";
    			t1 = space();
    			h4 = element("h4");
    			t2 = text(/*message*/ ctx[0]);
    			attr_dev(span, "class", "error-close svelte-8fkqg0");
    			add_location(span, file, 21, 4, 426);
    			add_location(h4, file, 23, 4, 493);
    			attr_dev(div0, "class", "error svelte-8fkqg0");
    			add_location(div0, file, 20, 2, 402);
    			attr_dev(div1, "class", "container svelte-8fkqg0");
    			add_location(div1, file, 18, 0, 317);
    			dispose = listen_dev(span, "click", /*closeError*/ ctx[2], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div0, t1);
    			append_dev(div0, h4);
    			append_dev(h4, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 1) set_data_dev(t2, /*message*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, slide, {
    						delay: 100,
    						duration: 300,
    						easing: circIn
    					});

    					div1_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(18:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let if_block = /*show*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*show*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { message } = $$props;
    	let { show } = $$props;

    	function closeError() {
    		dispatch("close-error");
    	}

    	const writable_props = ["message", "show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    		if ("show" in $$props) $$invalidate(1, show = $$props.show);
    	};

    	$$self.$capture_state = () => {
    		return { message, show };
    	};

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    		if ("show" in $$props) $$invalidate(1, show = $$props.show);
    	};

    	return [message, show, closeError];
    }

    class Error$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { message: 0, show: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*message*/ ctx[0] === undefined && !("message" in props)) {
    			console.warn("<Error> was created without expected prop 'message'");
    		}

    		if (/*show*/ ctx[1] === undefined && !("show" in props)) {
    			console.warn("<Error> was created without expected prop 'show'");
    		}
    	}

    	get message() {
    		throw new Error_1("<Error>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error_1("<Error>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error_1("<Error>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error_1("<Error>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Users/Login.svelte generated by Svelte v3.16.5 */

    const { Error: Error_1$1 } = globals;
    const file$1 = "src/Users/Login.svelte";

    // (72:0) {:else}
    function create_else_block_1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Sign Up";
    			add_location(h1, file$1, 72, 2, 1603);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(72:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (70:0) {#if login}
    function create_if_block_1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Login";
    			add_location(h1, file$1, 70, 2, 1578);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(70:0) {#if login}",
    		ctx
    	});

    	return block;
    }

    // (99:0) {:else}
    function create_else_block(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Login";
    			attr_dev(button, "type", "submit");
    			add_location(button, file$1, 99, 0, 2052);
    			dispose = listen_dev(button, "click", prevent_default(/*loginUser*/ ctx[6]), false, true, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(99:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (89:0) {#if !login}
    function create_if_block$1(ctx) {
    	let label;
    	let t0;
    	let br;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t0 = text("Confirm Password");
    			br = element("br");
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Sign Up";
    			add_location(br, file$1, 90, 16, 1877);
    			attr_dev(input, "type", "password");
    			attr_dev(input, "name", "cPassword");
    			add_location(input, file$1, 91, 0, 1882);
    			attr_dev(label, "class", "svelte-h6pccu");
    			add_location(label, file$1, 89, 0, 1853);
    			attr_dev(button, "type", "submit");
    			add_location(button, file$1, 94, 0, 1962);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[11]),
    				listen_dev(button, "click", prevent_default(/*signUpUser*/ ctx[7]), false, true, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t0);
    			append_dev(label, br);
    			append_dev(label, t1);
    			append_dev(label, input);
    			set_input_value(input, /*confirmPassword*/ ctx[4]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*confirmPassword*/ 16 && input.value !== /*confirmPassword*/ ctx[4]) {
    				set_input_value(input, /*confirmPassword*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(89:0) {#if !login}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let hr;
    	let t1;
    	let div1;
    	let form;
    	let label0;
    	let t2;
    	let br0;
    	let t3;
    	let input0;
    	let t4;
    	let label1;
    	let t5;
    	let br1;
    	let t6;
    	let input1;
    	let t7;
    	let t8;
    	let label2;
    	let t9;
    	let input2;
    	let t10;
    	let current;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*login*/ ctx[5]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*login*/ ctx[5]) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const error = new Error$1({
    			props: {
    				show: /*errorShow*/ ctx[1],
    				message: /*errorMessage*/ ctx[0]
    			},
    			$$inline: true
    		});

    	error.$on("close-error", /*close_error_handler*/ ctx[13]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			div1 = element("div");
    			form = element("form");
    			label0 = element("label");
    			t2 = text("Email");
    			br0 = element("br");
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			t5 = text("Password");
    			br1 = element("br");
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			if_block1.c();
    			t8 = space();
    			label2 = element("label");
    			t9 = text("Login\n");
    			input2 = element("input");
    			t10 = space();
    			create_component(error.$$.fragment);
    			attr_dev(div0, "class", "header");
    			add_location(div0, file$1, 68, 0, 1543);
    			add_location(hr, file$1, 75, 0, 1635);
    			add_location(br0, file$1, 79, 5, 1679);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "name", "email");
    			add_location(input0, file$1, 80, 0, 1684);
    			attr_dev(label0, "class", "svelte-h6pccu");
    			add_location(label0, file$1, 78, 0, 1666);
    			add_location(br1, file$1, 84, 8, 1763);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "name", "password");
    			add_location(input1, file$1, 85, 0, 1768);
    			attr_dev(label1, "class", "svelte-h6pccu");
    			add_location(label1, file$1, 83, 0, 1747);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "name", "login");
    			add_location(input2, file$1, 107, 0, 2152);
    			attr_dev(label2, "class", "svelte-h6pccu");
    			add_location(label2, file$1, 105, 0, 2138);
    			add_location(form, file$1, 77, 0, 1659);
    			attr_dev(div1, "class", "form svelte-h6pccu");
    			add_location(div1, file$1, 76, 0, 1640);
    			attr_dev(div2, "id", "card");
    			attr_dev(div2, "class", "svelte-h6pccu");
    			add_location(div2, file$1, 67, 0, 1527);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    				listen_dev(input2, "change", /*input2_change_handler*/ ctx[12])
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if_block0.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, hr);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, form);
    			append_dev(form, label0);
    			append_dev(label0, t2);
    			append_dev(label0, br0);
    			append_dev(label0, t3);
    			append_dev(label0, input0);
    			set_input_value(input0, /*email*/ ctx[2]);
    			append_dev(form, t4);
    			append_dev(form, label1);
    			append_dev(label1, t5);
    			append_dev(label1, br1);
    			append_dev(label1, t6);
    			append_dev(label1, input1);
    			set_input_value(input1, /*password*/ ctx[3]);
    			append_dev(form, t7);
    			if_block1.m(form, null);
    			append_dev(form, t8);
    			append_dev(form, label2);
    			append_dev(label2, t9);
    			append_dev(label2, input2);
    			input2.checked = /*login*/ ctx[5];
    			insert_dev(target, t10, anchor);
    			mount_component(error, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (dirty & /*email*/ 4 && input0.value !== /*email*/ ctx[2]) {
    				set_input_value(input0, /*email*/ ctx[2]);
    			}

    			if (dirty & /*password*/ 8 && input1.value !== /*password*/ ctx[3]) {
    				set_input_value(input1, /*password*/ ctx[3]);
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(form, t8);
    				}
    			}

    			if (dirty & /*login*/ 32) {
    				input2.checked = /*login*/ ctx[5];
    			}

    			const error_changes = {};
    			if (dirty & /*errorShow*/ 2) error_changes.show = /*errorShow*/ ctx[1];
    			if (dirty & /*errorMessage*/ 1) error_changes.message = /*errorMessage*/ ctx[0];
    			error.$set(error_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(error.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(error.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block0.d();
    			if_block1.d();
    			if (detaching) detach_dev(t10);
    			destroy_component(error, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let errorMessage;
    	let errorShow;
    	let email;
    	let password;
    	let confirmPassword;
    	let login = true;

    	async function loginUser() {
    		const res = await fetch("/login", {
    			method: "POST",
    			headers: {
    				"Content-Type": "application/json",
    				"Accept": "application/json"
    			},
    			body: JSON.stringify({ email, password })
    		});

    		const response = await res.json();

    		if (!response.success) {
    			console.log("Login or signup failed");
    			return false;
    		}

    		dispatch("login-user", response);
    	}

    	async function signUpUser() {
    		if (password !== confirmPassword) {
    			$$invalidate(0, errorMessage = "Passwords do not match");
    			$$invalidate(1, errorShow = true);
    			return false;
    		}

    		const res = await fetch("/signup", {
    			method: "POST",
    			headers: {
    				"Content-Type": "application/json",
    				"Accept": "application/json"
    			},
    			body: JSON.stringify({ email, password })
    		});

    		const response = await res.json();

    		if (!response.success) {
    			$$invalidate(0, errorMessage = response.message);
    			$$invalidate(1, errorShow = true);
    			return false;
    		}

    		$$invalidate(1, errorShow = false);
    		dispatch("login-user", response);
    	}

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate(2, email);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(3, password);
    	}

    	function input_input_handler() {
    		confirmPassword = this.value;
    		$$invalidate(4, confirmPassword);
    	}

    	function input2_change_handler() {
    		login = this.checked;
    		$$invalidate(5, login);
    	}

    	const close_error_handler = () => $$invalidate(1, errorShow = false);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("errorMessage" in $$props) $$invalidate(0, errorMessage = $$props.errorMessage);
    		if ("errorShow" in $$props) $$invalidate(1, errorShow = $$props.errorShow);
    		if ("email" in $$props) $$invalidate(2, email = $$props.email);
    		if ("password" in $$props) $$invalidate(3, password = $$props.password);
    		if ("confirmPassword" in $$props) $$invalidate(4, confirmPassword = $$props.confirmPassword);
    		if ("login" in $$props) $$invalidate(5, login = $$props.login);
    	};

    	return [
    		errorMessage,
    		errorShow,
    		email,
    		password,
    		confirmPassword,
    		login,
    		loginUser,
    		signUpUser,
    		dispatch,
    		input0_input_handler,
    		input1_input_handler,
    		input_input_handler,
    		input2_change_handler,
    		close_error_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Board/Note.svelte generated by Svelte v3.16.5 */
    const file$2 = "src/Board/Note.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let button;
    	let div_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*noteBody*/ ctx[0]);
    			t1 = space();
    			button = element("button");
    			button.textContent = "X";
    			attr_dev(button, "class", "svelte-z7oj7y");
    			add_location(button, file$2, 19, 4, 441);
    			attr_dev(div, "id", "note");
    			attr_dev(div, "class", "svelte-z7oj7y");
    			add_location(div, file$2, 16, 2, 310);
    			dispose = listen_dev(button, "click", /*deleteNote*/ ctx[1], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, button);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*noteBody*/ 1) set_data_dev(t0, /*noteBody*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					scale,
    					{
    						duration: 250,
    						delay: 10,
    						opacity: 0.5,
    						start: 0.5,
    						easing: quintOut
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				scale,
    				{
    					duration: 250,
    					delay: 10,
    					opacity: 0.5,
    					start: 0.5,
    					easing: quintOut
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let dispatch = createEventDispatcher();
    	let { noteBody } = $$props;
    	let { id } = $$props;

    	function deleteNote() {
    		dispatch("delete-note", id);
    	}

    	const writable_props = ["noteBody", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Note> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("noteBody" in $$props) $$invalidate(0, noteBody = $$props.noteBody);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    	};

    	$$self.$capture_state = () => {
    		return { dispatch, noteBody, id };
    	};

    	$$self.$inject_state = $$props => {
    		if ("dispatch" in $$props) dispatch = $$props.dispatch;
    		if ("noteBody" in $$props) $$invalidate(0, noteBody = $$props.noteBody);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    	};

    	return [noteBody, deleteNote, id];
    }

    class Note extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { noteBody: 0, id: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Note",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*noteBody*/ ctx[0] === undefined && !("noteBody" in props)) {
    			console.warn("<Note> was created without expected prop 'noteBody'");
    		}

    		if (/*id*/ ctx[2] === undefined && !("id" in props)) {
    			console.warn("<Note> was created without expected prop 'id'");
    		}
    	}

    	get noteBody() {
    		throw new Error("<Note>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noteBody(value) {
    		throw new Error("<Note>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Note>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Note>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Board/List.svelte generated by Svelte v3.16.5 */

    const { console: console_1 } = globals;
    const file$3 = "src/Board/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (80:0) {#if notes}
    function create_if_block$2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*notes*/ ctx[1];
    	const get_key = ctx => /*note*/ ctx[10].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const each_value = /*notes*/ ctx[1];
    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    			check_outros();
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(80:0) {#if notes}",
    		ctx
    	});

    	return block;
    }

    // (81:2) {#each notes as note (note.id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let current;

    	const note = new Note({
    			props: {
    				noteBody: /*note*/ ctx[10].body,
    				id: /*note*/ ctx[10].id
    			},
    			$$inline: true
    		});

    	note.$on("delete-note", /*deleteNote*/ ctx[4]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(note.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(note, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const note_changes = {};
    			if (dirty & /*notes*/ 2) note_changes.noteBody = /*note*/ ctx[10].body;
    			if (dirty & /*notes*/ 2) note_changes.id = /*note*/ ctx[10].id;
    			note.$set(note_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(note.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(note.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(note, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(81:2) {#each notes as note (note.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let div3;
    	let div1;
    	let div0;
    	let span0;
    	let t0;
    	let t1;
    	let span1;
    	let t3;
    	let div2;
    	let input;
    	let t4;
    	let button;
    	let t6;
    	let section_transition;
    	let current;
    	let dispose;
    	let if_block = /*notes*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "X";
    			t3 = space();
    			div2 = element("div");
    			input = element("input");
    			t4 = space();
    			button = element("button");
    			button.textContent = "Add Note";
    			t6 = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "list-name svelte-1hci5oj");
    			add_location(span0, file$3, 68, 4, 1398);
    			attr_dev(span1, "class", "delete-list svelte-1hci5oj");
    			add_location(span1, file$3, 71, 4, 1452);
    			attr_dev(div0, "class", "name svelte-1hci5oj");
    			add_location(div0, file$3, 67, 2, 1375);
    			add_location(div1, file$3, 66, 0, 1367);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "new-note");
    			attr_dev(input, "class", "svelte-1hci5oj");
    			add_location(input, file$3, 76, 2, 1556);
    			attr_dev(button, "class", "svelte-1hci5oj");
    			add_location(button, file$3, 77, 2, 1615);
    			attr_dev(div2, "class", "new-note svelte-1hci5oj");
    			add_location(div2, file$3, 75, 0, 1531);
    			attr_dev(div3, "class", "list svelte-1hci5oj");
    			add_location(div3, file$3, 65, 0, 1348);
    			add_location(section, file$3, 63, 0, 1269);

    			dispose = [
    				listen_dev(span1, "click", /*deleteList*/ ctx[5], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    				listen_dev(button, "click", /*addNote*/ ctx[3], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, input);
    			set_input_value(input, /*newNote*/ ctx[2]);
    			append_dev(div2, t4);
    			append_dev(div2, button);
    			append_dev(div3, t6);
    			if (if_block) if_block.m(div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);

    			if (dirty & /*newNote*/ 4 && input.value !== /*newNote*/ ctx[2]) {
    				set_input_value(input, /*newNote*/ ctx[2]);
    			}

    			if (/*notes*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (!section_transition) section_transition = create_bidirectional_transition(
    					section,
    					slide,
    					{
    						delay: 50,
    						duration: 185,
    						easing: quintOut
    					},
    					true
    				);

    				section_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);

    			if (!section_transition) section_transition = create_bidirectional_transition(
    				section,
    				slide,
    				{
    					delay: 50,
    					duration: 185,
    					easing: quintOut
    				},
    				false
    			);

    			section_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			if (detaching && section_transition) section_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let dispatch = createEventDispatcher();
    	let { id } = $$props;
    	let { name } = $$props;
    	let notes = [];
    	let newNote;

    	onMount(() => {
    		getNotes();
    	});

    	async function getNotes() {
    		const res = await fetch(`/list/${id}/notes`);
    		const resJson = await res.json();
    		$$invalidate(1, notes = resJson.notes);
    	}

    	async function addNote() {
    		const res = await fetch("/addNote", {
    			method: "POST",
    			headers: {
    				"Content-Type": "application/json",
    				"Accept": "application/json"
    			},
    			body: JSON.stringify({ body: newNote, list_id: id })
    		});

    		console.log(notes);
    		$$invalidate(1, notes = [await res.json(), ...notes]);
    		$$invalidate(2, newNote = "");
    	}

    	async function deleteNote(event) {
    		const selectedId = event.detail;
    		const res = await fetch(`/deleteNote/${selectedId}`, { method: "DELETE" });
    		let updatedNotes = notes.filter(note => note.id !== selectedId);
    		$$invalidate(1, notes = updatedNotes);
    	}

    	function deleteList() {
    		dispatch("delete-list", id);
    	}

    	const writable_props = ["id", "name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		newNote = this.value;
    		$$invalidate(2, newNote);
    	}

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => {
    		return { dispatch, id, name, notes, newNote };
    	};

    	$$self.$inject_state = $$props => {
    		if ("dispatch" in $$props) dispatch = $$props.dispatch;
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("notes" in $$props) $$invalidate(1, notes = $$props.notes);
    		if ("newNote" in $$props) $$invalidate(2, newNote = $$props.newNote);
    	};

    	return [
    		name,
    		notes,
    		newNote,
    		addNote,
    		deleteNote,
    		deleteList,
    		id,
    		dispatch,
    		getNotes,
    		input_input_handler
    	];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { id: 6, name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*id*/ ctx[6] === undefined && !("id" in props)) {
    			console_1.warn("<List> was created without expected prop 'id'");
    		}

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console_1.warn("<List> was created without expected prop 'name'");
    		}
    	}

    	get id() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Board/Board.svelte generated by Svelte v3.16.5 */
    const file$4 = "src/Board/Board.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (72:2) {#if lists}
    function create_if_block$3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*lists*/ ctx[0];
    	const get_key = ctx => /*list*/ ctx[8].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const each_value = /*lists*/ ctx[0];
    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    			check_outros();
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(72:2) {#if lists}",
    		ctx
    	});

    	return block;
    }

    // (73:4) {#each lists as list, index (list.id)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let current;

    	const list = new List({
    			props: {
    				name: /*list*/ ctx[8].name,
    				id: /*list*/ ctx[8].id
    			},
    			$$inline: true
    		});

    	list.$on("delete-list", /*deleteList*/ ctx[3]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(list.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(list, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const list_changes = {};
    			if (dirty & /*lists*/ 1) list_changes.name = /*list*/ ctx[8].name;
    			if (dirty & /*lists*/ 1) list_changes.id = /*list*/ ctx[8].id;
    			list.$set(list_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(list, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(73:4) {#each lists as list, index (list.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let input;
    	let t0;
    	let button0;
    	let t2;
    	let div0;
    	let button1;
    	let t4;
    	let div2;
    	let current;
    	let dispose;
    	let if_block = /*lists*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Add List";
    			t2 = space();
    			div0 = element("div");
    			button1 = element("button");
    			button1.textContent = "Log Out";
    			t4 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "newList");
    			attr_dev(input, "placeholder", "New List Name");
    			attr_dev(input, "class", "svelte-1q454s");
    			add_location(input, file$4, 61, 4, 1213);
    			attr_dev(button0, "class", "svelte-1q454s");
    			add_location(button0, file$4, 62, 4, 1302);
    			attr_dev(button1, "class", "svelte-1q454s");
    			add_location(button1, file$4, 65, 6, 1391);
    			attr_dev(div0, "class", "logout-button svelte-1q454s");
    			add_location(div0, file$4, 64, 4, 1357);
    			attr_dev(div1, "class", "new-list svelte-1q454s");
    			add_location(div1, file$4, 60, 2, 1186);
    			attr_dev(div2, "class", "column svelte-1q454s");
    			add_location(div2, file$4, 70, 2, 1469);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    				listen_dev(button0, "click", /*addList*/ ctx[2], false, false, false),
    				listen_dev(button1, "click", /*logoutUser*/ ctx[4], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			set_input_value(input, /*listName*/ ctx[1]);
    			append_dev(div1, t0);
    			append_dev(div1, button0);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, button1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div2, anchor);
    			if (if_block) if_block.m(div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*listName*/ 2 && input.value !== /*listName*/ ctx[1]) {
    				set_input_value(input, /*listName*/ ctx[1]);
    			}

    			if (/*lists*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	onMount(() => {
    		getLists();
    	});

    	let lists = [];
    	let listName;

    	async function getLists() {
    		const res = await fetch("/lists");
    		const response = await res.json();
    		$$invalidate(0, lists = response.lists);
    	}

    	async function addList() {
    		const res = await fetch("/addList", {
    			method: "POST",
    			headers: {
    				"Content-Type": "application/json",
    				"Accept": "application/json"
    			},
    			body: JSON.stringify({ name: listName })
    		});

    		$$invalidate(0, lists = [...lists, await res.json()]);
    		$$invalidate(1, listName = "");
    	}

    	async function deleteList(event) {
    		const selectedId = event.detail;
    		const res = await fetch(`/deleteList/${selectedId}`, { method: "DELETE" });
    		let updatedLists = lists.filter(list => list.id !== selectedId);
    		$$invalidate(0, lists = updatedLists);
    	}

    	async function logoutUser() {
    		dispatch("logout-user");
    		const res = await fetch(`/logout`);
    		const response = await res.json();
    	}

    	function input_input_handler() {
    		listName = this.value;
    		$$invalidate(1, listName);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("lists" in $$props) $$invalidate(0, lists = $$props.lists);
    		if ("listName" in $$props) $$invalidate(1, listName = $$props.listName);
    	};

    	return [
    		lists,
    		listName,
    		addList,
    		deleteList,
    		logoutUser,
    		dispatch,
    		getLists,
    		input_input_handler
    	];
    }

    class Board extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.5 */
    const file$5 = "src/App.svelte";

    // (35:0) {:else}
    function create_else_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$5, 35, 1, 688);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(35:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (33:19) 
    function create_if_block_1$1(ctx) {
    	let current;
    	const board = new Board({ $$inline: true });
    	board.$on("logout-user", /*logoutUser*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(board.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(board, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(board.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(board.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(board, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(33:19) ",
    		ctx
    	});

    	return block;
    }

    // (30:0) {#if loggedIn == false}
    function create_if_block$4(ctx) {
    	let current;
    	const login = new Login({ $$inline: true });

    	login.$on("login-user", function () {
    		/*login_user_handler*/ ctx[2].apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(30:0) {#if loggedIn == false}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_if_block_1$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*loggedIn*/ ctx[0] == false) return 0;
    		if (/*loggedIn*/ ctx[0]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let loggedIn;

    	onMount(async () => {
    		const res = await fetch("/checkLogin");
    		const response = await res.json();

    		if (response.logged_in) {
    			$$invalidate(0, loggedIn = true);
    		} else {
    			$$invalidate(0, loggedIn = false);
    		}
    	});

    	async function logoutUser() {
    		$$invalidate(0, loggedIn = false);
    		const res = await fetch(`/logout`);
    		const response = await res.json();
    	}

    	const login_user_handler = event => $$invalidate(0, loggedIn = event.detail.success);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("loggedIn" in $$props) $$invalidate(0, loggedIn = $$props.loggedIn);
    	};

    	return [loggedIn, logoutUser, login_user_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
