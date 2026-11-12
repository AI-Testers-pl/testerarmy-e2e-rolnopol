#!/usr/bin/env python3
"""Wypisuje z .e2e/report.json kroki agent.* każdego testu: status, cache, akcje, wyjaśnienie agenta."""
import json, sys
r = json.load(open(sys.argv[1] if len(sys.argv) > 1 else '.e2e/report.json'))
for t in r['run'].get('results', []):
    if t.get('kind') == 'setup' or not t.get('selected'):
        continue
    print('##', ' > '.join(t['titlePath']), '->', t['status'])
    for a in t.get('attempts', []):
        for s in a['steps']:
            if s['kind'] != 'agent':
                if s['status'] != 'passed':
                    print('   ', s['api'], s['status'], (s.get('error') or {}).get('message', '')[:160])
                continue
            c = s.get('cache') or {}
            m = s.get('metrics') or {}
            print(f"   {s['api']} [{s['status']}] {s['durationMs']/1000:.1f}s calls={m.get('modelCalls')} "
                  f"cache={c.get('status')}/{c.get('reason')}/{c.get('write')}  {c.get('detail','')[:100]}")
            for e in s.get('events', []):
                if e['kind'] == 'engine':
                    print('      -', e.get('detail'))
            if s.get('explanation'):
                print('      >', s['explanation'][:400])
