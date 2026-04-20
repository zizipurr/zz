import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './AiModal.module.scss'

interface Props {
  summary: string
  onClose: () => void
  onSendComingSoon: () => void
}

export default function AiModal({ summary, onClose, onSendComingSoon }: Props) {
  const [question, setQuestion] = useState('')

  function handleSend() {
    if (!question.trim()) return
    onSendComingSoon()
    setQuestion('')
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>AI 智能助手</div>
          <button type="button" className={styles.close} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>
          <div className={styles.greeting}>{summary}</div>
          <div className={styles.note}>AI 对话功能 · 8月接入公司大模型</div>
        </div>
        <div className={styles.footer}>
          <input
            className={styles.input}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="请输入你想咨询的问题..."
          />
          <button type="button" className={styles.sendBtn} onClick={handleSend}>发送</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
