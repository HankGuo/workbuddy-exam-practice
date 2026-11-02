#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""解析题库合并 md -> 结构化 JS 数据 (data.js)"""
import re, json

SRC = "/Users/hankia/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/gdro573844004_36e8/temp/RWTemp/2026-11/507d3e47046344bf3b336616c4fe690e/题库合并-两卷93题-给吴熳.md"

with open(SRC, encoding="utf-8") as f:
    raw = f.read()

# 切成三段
parts = re.split(r'^# Part (One|Two|Three)', raw, flags=re.M)
# parts: ['前置...', 'One', '<one body>', 'Two', '<two body>', 'Three', '<three body>']
blocks = {}
order = {"One": "single", "Two": "multiple", "Three": "bool"}
for i in range(1, len(parts), 2):
    key = order[parts[i]]
    blocks[key] = parts[i+1]

# 9 道错题速记卡锚点 (type, no) -> 一句话锚点
anchors = {
    ("single", 14): "VS Code 登录 timeout：>show out 打开输出通道选 CodeBuddy，复制链接浏览器扫码",
    ("single", 20): "十四五人：支点1=10人硬顶，「第11人进不去——不是钱的问题，是走不通」",
    ("single", 42): "150人专享VPC+专属插件=企业专享版，316元/月×12=3,792元/人/年",
    ("single", 44): "凭什么换掉悟空+钉钉：「只活在钉钉里，技能生态单薄」（A 错：钉钉恰恰强在协作）",
    ("multiple", 1): "合规审计层：补上「数据本地执行不上传」；「数据用于训练」永远不选",
    ("multiple", 2): "扩展机制：连接器=外部服务、资料库=内部知识；B 张冠李戴",
    ("multiple", 9): "二次确认弹窗核对：补「执行理由」；「确认次数越少越安全」是反话",
    ("multiple", 11): "腾讯文档可升级权益：补「企业个性化与系统集成」；D 知识治理属于乐享知识库",
    ("multiple", 18): "扩容促单：D「到期后加量包继续独立用」与 6 个月有效期矛盾；C 活动期已过",
}

def parse_block(body, qtype):
    # 按 "## Q" 切题
    chunks = re.split(r'(?m)^##\s+Q(\d+)', body)
    out = []
    # chunks: ['', '1', 'header+body', '2', '...']
    for i in range(1, len(chunks), 2):
        no = int(chunks[i])
        seg = chunks[i+1]
        # header 第一行
        first_line = seg.split("\n", 1)[0]
        header = first_line
        # 答案
        ans = None
        m = re.search(r'答案\s*([对错误A-Z、，,\s]+)', header)
        if m:
            ans = m.group(1)
        else:
            m2 = re.search(r'推荐改选\s*([A-Z、，,\s]+)|推荐\s*([A-Z、，,\s]+)', header)
            if m2:
                ans = m2.group(1) or m2.group(2)
        flags = {
            "confirmed": "✅" in header,
            "recommended": "⭐" in header,
            "hot": "🔥" in header,
        }
        # 规范化答案
        if ans is not None:
            if qtype == "bool":
                ans_clean = "对" if "对" in ans else ("错" if "错" in ans else None)
                answer = [ans_clean] if ans_clean else []
            else:
                toks = re.split(r'[、，,\s]+', ans.strip())
                answer = [t.upper() for t in toks if t.strip() and re.match(r'[A-Z]', t)]
        else:
            answer = []

        # 切出 题目/正文 与 选项
        # 去掉 header 行
        rest = seg.split("\n", 1)[1] if "\n" in seg else ""
        # 多选题/单选题：找 **题目**：
        qtext = ""
        options = []
        if qtype in ("single", "multiple"):
            mt = re.search(r'\*\*题目\*\*[：:]\s*(.+?)(?=\n-)', rest, flags=re.S)
            if mt:
                qtext = mt.group(1).strip()
            else:
                # 退化：取第一个非空行
                for line in rest.splitlines():
                    if line.strip() and not line.strip().startswith("-"):
                        qtext = line.strip()
                        break
            # 选项行
            for line in rest.splitlines():
                line = line.strip()
                om = re.match(r'^-\s+\**\s*([A-Z])\.\s*(.+)$', line)
                if om:
                    key = om.group(1)
                    txt = om.group(2).strip()
                    note = ""
                    if "←" in txt:
                        txt, note = txt.split("←", 1)
                        txt = txt.strip().rstrip("*").strip()
                        note = note.strip().lstrip("*").strip()
                    # 去掉尾部 ** 加粗残留
                    txt = txt.replace("**", "").strip()
                    note = note.replace("**", "").strip()
                    options.append({"key": key, "text": txt, "note": note})
        else:  # bool
            # 题干是 header 之后的第一个非空段落
            for line in rest.splitlines():
                s = line.strip()
                if s and not s.startswith("#"):
                    qtext = s
                    break
            options = [{"key": "对", "text": ""}, {"key": "错", "text": ""}]

        anchor = anchors.get((qtype, no), "")
        out.append({
            "id": ("s" if qtype == "single" else "m" if qtype == "multiple" else "b") + str(no),
            "type": qtype,
            "no": no,
            "text": qtext,
            "options": options,
            "answer": answer,
            "flags": flags,
            "anchor": anchor,
        })
    return out

all_q = []
for key in ("single", "multiple", "bool"):
    all_q.extend(parse_block(blocks[key], key))

# 校验数量
from collections import Counter
c = Counter(q["type"] for q in all_q)
print("counts:", dict(c), "total:", len(all_q))

# 输出：校验无答案的题
missing = [q["id"] for q in all_q if not q["answer"]]
if missing:
    print("WARN missing answer:", missing)

# 写出 JS
with open("data.js", "w", encoding="utf-8") as f:
    f.write("// 自动生成，勿手改。来源：题库合并-两卷93题-给吴熳.md\n")
    f.write("const META = ")
    f.write(json.dumps({
        "single": c.get("single", 0),
        "multiple": c.get("multiple", 0),
        "bool": c.get("bool", 0),
        "total": len(all_q),
    }, ensure_ascii=False))
    f.write(";\n")
    f.write("const QUESTIONS = ")
    f.write(json.dumps(all_q, ensure_ascii=False, indent=1))
    f.write(";\n")

print("written data.js")
