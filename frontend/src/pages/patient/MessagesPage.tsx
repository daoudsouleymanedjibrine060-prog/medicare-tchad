import { useEffect, useState, useMemo } from 'react';
import { Send } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: Contact;
  receiver: Contact;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const load = () => {
    api.get('/messages').then(({ data }) => setMessages(data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/messages/contacts').then(({ data }) => {
      setContacts(data);
      if (data.length) setSelected(data[0].id);
    });
  }, []);

  const selectContact = async (contactId: string) => {
    setSelected(contactId);
    const unread = messages.filter(
      (m) => !m.isRead && m.receiver.id === user?.id &&
        (m.sender.id === contactId || m.receiver.id === contactId),
    );
    if (!unread.length) return;
    await Promise.all(unread.map((m) => api.patch(`/messages/${m.id}/read`)));
    setMessages((prev) => prev.map((m) =>
      unread.some((u) => u.id === m.id) ? { ...m, isRead: true } : m,
    ));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !content.trim()) return;
    setSending(true);
    setSendError('');
    try {
      await api.post('/messages', { receiverId: selected, content });
      setContent('');
      load();
    } catch {
      setSendError('Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const thread = useMemo(() => {
    const filtered = selected
      ? messages.filter((m) => m.sender.id === selected || m.receiver.id === selected)
      : messages;
    return [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, selected]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Messages</h1>
      <p className="text-slate-500 mt-1">
        {user?.role === 'ASSISTANT' ? 'Répondre aux patients' : user?.role === 'DOCTOR' ? 'Communiquez avec vos patients, assistants et l\'administration' : 'Communiquez avec les assistants et l\'administration'}
      </p>
      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-sm mb-3">Contacts</h2>
          <div className="space-y-1">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => selectContact(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selected === c.id ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50'}`}
              >
                {c.firstName} {c.lastName}
                <span className="block text-xs text-slate-400">{c.role}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border flex flex-col min-h-[400px]">
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-slate-500">Chargement...</p>
            ) : thread.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun message</p>
            ) : (
              thread.map((m) => {
                const isMine = m.sender.id === user?.id;
                return (
                <div key={m.id} className={`p-3 rounded-lg text-sm max-w-[80%] ${isMine ? 'bg-primary-50 ml-auto' : 'bg-slate-100'}`}>
                  <p className="font-medium text-xs text-slate-500 mb-1">
                    {m.sender.firstName} {m.sender.lastName}
                  </p>
                  <p>{m.content}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(m.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                );
              })
            )}
          </div>
          <form onSubmit={send} className="border-t p-4 flex flex-col gap-2">
            {sendError && <p className="text-xs text-red-600">{sendError}</p>}
            <div className="flex gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button type="submit" disabled={sending} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
