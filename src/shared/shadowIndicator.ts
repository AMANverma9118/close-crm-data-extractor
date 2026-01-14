import { SHADOW_INDICATOR_ID } from './constants'

type IndicatorState = 'idle' | 'running' | 'success' | 'error'

const colors: Record<IndicatorState, string> = {
  idle: '#e2e8f0',
  running: '#2563eb',
  success: '#16a34a',
  error: '#dc2626',
}

export function createIndicator() {
  const existing = document.getElementById(SHADOW_INDICATOR_ID)
  if (existing) return buildApi(existing.shadowRoot!)

  const host = document.createElement('div')
  host.id = SHADOW_INDICATOR_ID
  host.style.position = 'fixed'
  host.style.zIndex = '2147483647'
  host.style.bottom = '16px'
  host.style.right = '16px'
  host.style.width = '220px'
  host.style.height = '64px'
  host.style.pointerEvents = 'none'

  const shadow = host.attachShadow({ mode: 'open' })
  const wrapper = document.createElement('div')
  wrapper.className = 'wrapper'
  wrapper.innerHTML = `
    <div class="card">
      <div class="dot"></div>
      <div class="text">
        <div class="title">Close Extractor</div>
        <div class="message">Idle</div>
      </div>
    </div>
  `

  const style = document.createElement('style')
  style.textContent = `
    :host, .wrapper { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    .card {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      border-radius: 12px;
      background: #0f172a;
      color: #f8fafc;
      box-shadow: 0 10px 30px rgba(0,0,0,0.18);
      border: 1px solid rgba(255,255,255,0.06);
      pointer-events: auto;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: ${colors.idle};
      flex-shrink: 0;
      transition: background 0.2s ease;
    }
    .title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
    }
    .message {
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
    }
  `

  shadow.append(style, wrapper)
  document.body.appendChild(host)

  return buildApi(shadow)
}

function buildApi(root: ShadowRoot) {
  const dot = root.querySelector<HTMLElement>('.dot')
  const message = root.querySelector<HTMLElement>('.message')

  const update = (state: IndicatorState, text: string) => {
    if (dot) dot.style.background = colors[state]
    if (message) message.textContent = text
  }

  const remove = () => {
    root.host?.remove()
  }

  return { update, remove }
}

