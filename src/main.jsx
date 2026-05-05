import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { hasSupabaseConfig, supabase } from './supabaseClient';
import './styles.css';

function App() {
  const [screen, setScreen] = useState('landing');
  const [entries, setEntries] = useState([]);
  const [dataStatus, setDataStatus] = useState(hasSupabaseConfig ? 'loading' : 'missingConfig');
  const [appError, setAppError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function hydrateFromSupabase() {
      if (!hasSupabaseConfig) return;

      try {
        const nextEntries = await fetchEntries();

        if (!ignore) {
          setEntries(nextEntries);
          setDataStatus('supabase');
          setAppError('');
        }
      } catch (error) {
        if (!ignore) {
          setDataStatus('error');
          setAppError(error.message);
        }
      }
    }

    hydrateFromSupabase();
    return () => {
      ignore = true;
    };
  }, []);

  async function reloadEntries() {
    if (!hasSupabaseConfig) return;
    setDataStatus('loading');
    try {
      setEntries(await fetchEntries());
      setDataStatus('supabase');
      setAppError('');
    } catch (error) {
      setDataStatus('error');
      setAppError(error.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Knowledge Registry</p>
          <h1>{screen === 'landing' ? 'Find registered topics' : 'Manage entries'}</h1>
        </div>
        <nav className="nav-tabs" aria-label="Primary navigation">
          <button className={screen === 'landing' ? 'active' : ''} onClick={() => setScreen('landing')}>
            Search
          </button>
          <button className={screen === 'register' ? 'active' : ''} onClick={() => setScreen('register')}>
            Registration
          </button>
        </nav>
      </header>

      {screen === 'landing' ? (
        <LandingPage entries={entries} onOpenRegistration={() => setScreen('register')} />
      ) : (
        <RegistrationPage
          appError={appError}
          dataStatus={dataStatus}
          entries={entries}
          onChange={setEntries}
          onReload={reloadEntries}
          onStatus={setDataStatus}
          onError={setAppError}
        />
      )}
    </main>
  );
}

function LandingPage({ entries, onOpenRegistration }) {
  const [query, setQuery] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [chosenTag, setChosenTag] = useState('');

  const areas = useMemo(() => unique(entries.map((entry) => entry.area)).sort(), [entries]);
  const areaFilteredEntries = useMemo(
    () => entries.filter((entry) => selectedAreas.length === 0 || selectedAreas.includes(entry.area)),
    [entries, selectedAreas],
  );

  const slashIndex = query.lastIndexOf('/');
  const tagMode = slashIndex >= 0;
  const tagSearch = tagMode ? query.slice(slashIndex + 1).trim().toLowerCase() : '';

  const tagSuggestions = useMemo(() => {
    if (!tagMode) return [];
    return areaFilteredEntries
      .filter((entry) => entry.tag.toLowerCase().includes(tagSearch) || entry.content.toLowerCase().includes(tagSearch))
      .map((entry) => entry.tag)
      .filter(uniqueFilter)
      .slice(0, 8);
  }, [areaFilteredEntries, tagMode, tagSearch]);

  const results = useMemo(() => {
    const cleanedQuery = query.replace(/\/[^\s]*/g, '').trim().toLowerCase();
    return areaFilteredEntries.filter((entry) => {
      const matchesTag = chosenTag ? entry.tag === chosenTag : true;
      const matchesTypedTag = tagMode && tagSearch
        ? entry.tag.toLowerCase().includes(tagSearch) || entry.content.toLowerCase().includes(tagSearch)
        : true;
      const searchable = `${entry.area} ${entry.tag} ${entry.content}`.toLowerCase();
      const matchesText = cleanedQuery ? searchable.includes(cleanedQuery) : true;
      return matchesTag && matchesTypedTag && matchesText;
    });
  }, [areaFilteredEntries, chosenTag, query, tagMode, tagSearch]);

  function toggleArea(area) {
    setSelectedAreas((current) =>
      current.includes(area) ? current.filter((item) => item !== area) : [...current, area],
    );
    setChosenTag('');
  }

  function selectTag(tag) {
    const prefix = slashIndex >= 0 ? query.slice(0, slashIndex).trim() : query;
    setQuery(prefix ? `${prefix} /${tag}` : `/${tag}`);
    setChosenTag(tag);
  }

  return (
    <section className="workspace">
      <div className="search-panel">
        <label htmlFor="topic-search">Search topics</label>
        <div className="search-row">
          <input
            id="topic-search"
            value={query}
            placeholder="Search by area, tag, or content. Type / for tags."
            onChange={(event) => {
              setQuery(event.target.value);
              if (!event.target.value.includes('/')) setChosenTag('');
            }}
          />
          {query && (
            <button
              className="icon-button"
              type="button"
              title="Clear search"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                setChosenTag('');
              }}
            >
              x
            </button>
          )}
        </div>

        <div className="filter-block">
          <p>Area filter</p>
          <div className="check-grid">
            {areas.map((area) => (
              <label key={area} className="check-pill">
                <input type="checkbox" checked={selectedAreas.includes(area)} onChange={() => toggleArea(area)} />
                <span>{area}</span>
              </label>
            ))}
          </div>
        </div>

        {tagMode && (
          <div className="suggestions" role="listbox" aria-label="Tag suggestions">
            {tagSuggestions.length > 0 ? (
              tagSuggestions.map((tag) => (
                <button key={tag} type="button" onClick={() => selectTag(tag)}>
                  /{tag}
                </button>
              ))
            ) : (
              <span>No matching tags</span>
            )}
          </div>
        )}
      </div>

      <div className="results-header">
        <p>{results.length} result{results.length === 1 ? '' : 's'}</p>
        <button type="button" className="secondary-button" onClick={onOpenRegistration}>
          Add entry
        </button>
      </div>

      <div className="results-list">
        {results.length > 0 ? (
          results.map((entry) => <ResultCard key={entry.id} entry={entry} />)
        ) : (
          <div className="empty-state">No registered topics match the current search.</div>
        )}
      </div>
    </section>
  );
}

function ResultCard({ entry }) {
  return (
    <article className="result-card">
      <div>
        <p className="area-label">{entry.area}</p>
        <h2>{entry.tag}</h2>
      </div>
      <pre>{entry.content}</pre>
    </article>
  );
}

function RegistrationPage({ appError, entries, dataStatus, onChange, onReload, onStatus, onError }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  function openAdd() {
    setForm(emptyForm);
    setError('');
    setModal({ type: 'add' });
  }

  function openEdit(entry) {
    setForm({ area: entry.area, tag: entry.tag, content: entry.content });
    setError('');
    setModal({ type: 'edit', entry });
  }

  function closeModal() {
    setModal(null);
    setError('');
  }

  async function saveEntry(event) {
    event.preventDefault();
    const normalized = normalizeForm(form);
    const duplicate = entries.some(
      (entry) => entry.tag.toLowerCase() === normalized.tag.toLowerCase() && entry.id !== modal?.entry?.id,
    );

    if (!normalized.area || !normalized.tag || !normalized.content) {
      setError('Area, question tag, and content are required.');
      return;
    }

    if (duplicate) {
      setError('Question Tag must be unique across all areas.');
      return;
    }

    if (modal.type === 'edit' && !window.confirm('Save changes to this entry?')) return;

    try {
      onStatus('saving');

      if (modal.type === 'add') {
        await createEntry(normalized);
      } else {
        await updateEntry(modal.entry.id, { tag: normalized.tag, content: normalized.content });
      }

      onChange(await fetchEntries());
      onStatus('supabase');
      onError('');
      closeModal();
    } catch (requestError) {
      onStatus('error');
      setError(readableSupabaseError(requestError));
    }
  }

  async function deleteEntry(entry) {
    if (window.confirm(`Delete "${entry.tag}"?`)) {
      try {
        onStatus('saving');
        await removeEntry(entry.id);
        onChange(await fetchEntries());
        onStatus('supabase');
        onError('');
      } catch (requestError) {
        onStatus('error');
        onError(readableSupabaseError(requestError));
      }
    }
  }

  return (
    <section className="workspace">
      <div className="table-toolbar">
        <div>
          <p className="section-kicker">Registered data</p>
          <h2>{entries.length} total entries</h2>
          <p className="data-source">{dataStatusLabel[dataStatus] ?? dataStatusLabel.empty}</p>
          {appError && <p className="form-error">{appError}</p>}
        </div>
        <div className="toolbar-actions">
          <button type="button" className="secondary-button" onClick={onReload} disabled={!hasSupabaseConfig || dataStatus === 'loading'}>
            Reload
          </button>
          <button type="button" className="primary-button" onClick={openAdd} disabled={!hasSupabaseConfig}>
            Add
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Area</th>
              <th>Question Tag</th>
              <th>Content</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td data-label="Serial Number">{entry.id}</td>
                <td data-label="Area">{entry.area}</td>
                <td data-label="Question Tag">{entry.tag}</td>
                <td data-label="Content">
                  <button
                    type="button"
                    className="icon-button"
                    title="View content"
                    aria-label={`View content for ${entry.tag}`}
                    onClick={() => setModal({ type: 'view', entry })}
                  >
                    <EyeIcon />
                  </button>
                </td>
                <td data-label="Action">
                  <div className="action-row">
                    <button type="button" className="secondary-button" onClick={() => openEdit(entry)}>
                      Edit
                    </button>
                    <button type="button" className="danger-button" onClick={() => deleteEntry(entry)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.type === 'view' && (
        <Modal title={modal.entry.tag} onClose={closeModal}>
          <p className="area-label">{modal.entry.area}</p>
          <pre className="content-preview">{modal.entry.content}</pre>
        </Modal>
      )}

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <Modal title={modal.type === 'add' ? 'Add entry' : 'Edit entry'} onClose={closeModal}>
          <form className="entry-form" onSubmit={saveEntry}>
            <label>
              Area
              <input
                value={form.area}
                disabled={modal.type === 'edit'}
                onChange={(event) => setForm({ ...form, area: event.target.value })}
              />
            </label>
            <label>
              Question Tag
              <input value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} />
            </label>
            <label>
              Content
              <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" title="Close" aria-label="Close modal" onClick={onClose}>
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.1 12S5.7 5.5 12 5.5 21.9 12 21.9 12 18.3 18.5 12 18.5 2.1 12 2.1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const emptyForm = { area: '', tag: '', content: '' };

const dataStatusLabel = {
  loading: 'Loading from Supabase',
  saving: 'Saving to Supabase',
  supabase: 'Reading and writing with Supabase',
  missingConfig: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase',
  error: 'Supabase request failed',
  empty: 'No data loaded',
};

function normalizeForm(form) {
  return {
    area: form.area.trim().toUpperCase(),
    tag: form.tag.trim(),
    content: form.content.trim(),
  };
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry, index) => ({
      id: Number.isFinite(Number(entry?.id)) ? Number(entry.id) : index + 1,
      area: String(entry?.area ?? '').trim().toUpperCase(),
      tag: String(entry?.tag ?? entry?.question_tag ?? '').trim(),
      content: String(entry?.content ?? '').trim(),
    }))
    .filter((entry) => entry.area && entry.tag && entry.content)
    .filter((entry, index, list) => {
      const tag = entry.tag.toLowerCase();
      return list.findIndex((candidate) => candidate.tag.toLowerCase() === tag) === index;
    })
    .map((entry, index) => ({ ...entry, id: index + 1 }));
}

function toEntry(row) {
  return {
    id: row.id,
    area: row.area,
    tag: row.question_tag,
    content: row.content,
  };
}

async function fetchEntries() {
  ensureSupabase();
  const { data, error } = await supabase
    .from('notes_entries')
    .select('id, area, question_tag, content')
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toEntry);
}

async function createEntry(entry) {
  ensureSupabase();
  const { error } = await supabase.from('notes_entries').insert({
    area: entry.area,
    question_tag: entry.tag,
    content: entry.content,
  });

  if (error) throw error;
}

async function updateEntry(id, entry) {
  ensureSupabase();
  const { error } = await supabase
    .from('notes_entries')
    .update({
      question_tag: entry.tag,
      content: entry.content,
    })
    .eq('id', id);

  if (error) throw error;
}

async function removeEntry(id) {
  ensureSupabase();
  const { error } = await supabase.from('notes_entries').delete().eq('id', id);

  if (error) throw error;
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

function readableSupabaseError(error) {
  if (error?.code === '23505') return 'Question Tag must be unique across all areas.';
  return error?.message ?? 'Supabase request failed.';
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function uniqueFilter(item, index, items) {
  return items.indexOf(item) === index;
}

createRoot(document.getElementById('root')).render(<App />);
