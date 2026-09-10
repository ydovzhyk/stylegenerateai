function renderInline(text, keyPrefix) {
  const nodes = []
  const pattern = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match
  let index = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    nodes.push(
      <strong key={`${keyPrefix}-${index}`} className="font-semibold text-white">
        {match[1]}
      </strong>,
    )
    index += 1
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function parseBlocks(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraph = []
  let list = null

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push({ type: 'p', text: paragraph.join(' ') })
    paragraph = []
  }

  const flushList = () => {
    if (!list) return
    blocks.push(list)
    list = null
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushList()
      return
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({
        type: `h${heading[1].length}`,
        text: heading[2],
      })
      return
    }

    const unordered = line.match(/^[-*]\s+(.+)$/)
    if (unordered) {
      flushParagraph()
      if (!list || list.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(unordered[1])
      return
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/)
    if (ordered) {
      flushParagraph()
      if (!list || list.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(ordered[1])
      return
    }

    flushList()
    paragraph.push(line)
  })

  flushParagraph()
  flushList()
  return blocks
}

export default function AssistantMarkdown({ text }) {
  const blocks = parseBlocks(text)

  if (!blocks.length) return null

  return (
    <div className="space-y-2 text-sm leading-6">
      {blocks.map((block, index) => {
        if (block.type === 'p') {
          return <p key={index}>{renderInline(block.text, `p${index}`)}</p>
        }

        if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
          return (
            <p
              key={index}
              className="pt-1 font-semibold text-white first:pt-0"
            >
              {renderInline(block.text, block.type + index)}
            </p>
          )
        }

        const ListTag = block.type === 'ol' ? 'ol' : 'ul'
        return (
          <ListTag
            key={index}
            className={
              block.type === 'ol'
                ? 'list-decimal space-y-1 pl-5'
                : 'list-disc space-y-1 pl-5'
            }
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                {renderInline(item, `${block.type}${index}-${itemIndex}`)}
              </li>
            ))}
          </ListTag>
        )
      })}
    </div>
  )
}
