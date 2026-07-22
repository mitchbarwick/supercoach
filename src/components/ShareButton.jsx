// One button that shares a link the best way the device allows —
// native share sheet on phones (Messenger/WhatsApp/email), clipboard
// copy everywhere else — with a little confirmation toast.
import { useState } from 'react'
import { shareLink } from '../share/share.js'

export default function ShareButton({
  url,
  title = 'SuperCoach',
  text = '',
  label = 'Share',
  icon = '🔗',
  className = 'btn btn-ghost btn-sm',
}) {
  const [toast, setToast] = useState('')

  const onClick = async () => {
    const result = await shareLink({ title, text, url })
    if (result === 'copied') setToast('Link copied — paste it into a message or email')
    else if (result === 'failed') setToast('Couldn’t copy — long-press the address bar to share')
    else setToast('')
    if (result) setTimeout(() => setToast(''), 2200)
  }

  return (
    <>
      <button type="button" className={className} onClick={onClick}>
        <span aria-hidden="true">{icon}</span> {label}
      </button>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
