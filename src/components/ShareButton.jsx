// One button that shares a link the best way the device allows —
// native share sheet on phones (Messenger/WhatsApp/email), clipboard
// copy everywhere else — with a little confirmation toast.
import { useState } from 'react'
import { shareLink } from '../share/share.js'
import Icon from '../icons/Icon.jsx'

export default function ShareButton({
  url,
  title = 'SuperCoach',
  text = '',
  label = 'Share',
  icon = 'share-2',
  className = 'btn btn-ghost btn-sm',
  ariaLabel,
}) {
  const [toast, setToast] = useState('')

  const onClick = async () => {
    if (!url) return
    const result = await shareLink({ title, text, url })
    if (result === 'copied') setToast('Link copied — paste it into a message or email')
    else if (result === 'failed') setToast('Couldn’t copy — long-press the address bar to share')
    else setToast('')
    if (result) setTimeout(() => setToast(''), 2200)
  }

  return (
    <>
      <button type="button" className={className} onClick={onClick} disabled={!url} aria-label={ariaLabel} title={ariaLabel}>
        <Icon name={icon} size={label ? 16 : 18} />{label && ` ${label}`}
      </button>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
