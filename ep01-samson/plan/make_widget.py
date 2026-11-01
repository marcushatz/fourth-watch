# Generates the camera-timeline widget module from shots.json (labels typed literally, marks drawn from rows).
import json, sys
s = json.load(open("shots.json"))
total = max(x["end"] for x in s)
rows = ",".join("{key:'%s',start:%s,end:%s,hold:%s}" % (x["key"], x["start"], x["end"], "true" if x["hold"] else "false") for x in s)
H = 112 + 22 * (len(s) - 1) + 40
names = "".join("<text data-claude-text-id='n-%s' x='24' y={Y('%s') + 4} fontWeight='%s' fill={ink}>%s</text>" % (x["key"], x["key"], "600" if x["hold"] else "400", x["name"]) for x in s)
moves = "".join("<text data-claude-text-id='m-%s' x='612' y={Y('%s') + 4} fontSize='11.5' fontWeight='%s' fill={%s}>%s</text>" % (x["key"], x["key"], "600" if x["hold"] else "400", "ink" if x["hold"] else "quiet", x["move"]) for x in s)
title = "%d shots in %d seconds; the camera stops only for the prayer" % (len(s), round(total))
code = ("export default () => <claude.Visualize data-claude-component='ep1-shot-timeline' sources={{shots:{kind:'data', data:[%s]}}}>"
 "{({shots, datum}) => { const x0 = 262, x1 = 596, T = %s; const X = s => x0 + s / T * (x1 - x0); const Y = k => 112 + 22 * shots.findIndex(r => r.key === k); "
 "const ticks = [0, 10, 20, 30, 40, 50]; const ink = 'var(--cds-text-primary)', quiet = 'var(--cds-text-secondary)', grid = 'var(--cds-chart-grid)', move = 'var(--cds-chart-categorical-1)', still = 'var(--cds-chart-categorical-2)'; "
 "return <svg viewBox='0 0 760 %d' role='img' aria-label='%s' fontSize='12'>"
 "<text data-claude-text-id='title' x='24' y='28' fontSize='15' fontWeight='600' fill={ink}>%s</text>"
 "<text data-claude-text-id='subtitle' x='24' y='47' fontSize='11.5' fill={quiet}>Ep 1 camera plan, revision 4 · bar = shot length · right = camera move</text>"
 "<g data-claude-anchor='legend'><rect x='24' y='60' width='14' height='10' rx='2' fill={move} fillOpacity='0.25' stroke={move}/><text data-claude-text-id='legend-move' x='44' y='69' fontSize='11.5' fill={quiet}>camera moving</text><rect x='140' y='60' width='14' height='10' rx='2' fill={still} fillOpacity='0.25' stroke={still}/><text data-claude-text-id='legend-hold' x='160' y='69' fontSize='11.5' fill={quiet}>locked hold</text></g>"
 "<g data-claude-anchor='time-axis'>{ticks.map(t => <g key={t}><line x1={X(t)} x2={X(t)} y1='96' y2='%d' stroke={grid}/><text x={X(t)} y='90' textAnchor='middle' fontSize='11.5' fill={quiet}>{`${t}s`}</text></g>)}</g>"
 "{shots.map(r => { const y = Y(r.key), c = r.hold ? still : move; return <g key={r.key} data-claude-anchor={`shot-${r.key}`}><rect x={X(r.start)} y={y - 7} width={Math.max(3, X(r.end) - X(r.start))} height='14' rx='4' fill={c} fillOpacity='0.25' stroke={c} strokeWidth='1.25' {...datum(r)}/></g>; })}"
 "<g data-claude-anchor='shot-names'>%s</g><g data-claude-anchor='moves'>%s</g></svg>; }}</claude.Visualize>;") % (rows, total, H, title, title, H - 20, names, moves)
open("widget_code.js", "w").write(code)
print(len(code), "chars; height", H)
