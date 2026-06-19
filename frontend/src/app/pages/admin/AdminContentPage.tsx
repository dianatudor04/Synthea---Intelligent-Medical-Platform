import { useEffect, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { poolsApi } from '../../../lib/services';
import { Pool, PoolItem } from '../../../lib/types';

type DialogState =
  | { kind: 'pool'; pool?: Pool }
  | { kind: 'item'; poolId: string; poolTitle: string; item?: PoolItem }
  | null;

export function AdminContentPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [dialog, setDialog] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);

  // Shared form fields (only the relevant ones are used per dialog kind).
  const [fTag, setFTag] = useState('');
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fAdvice, setFAdvice] = useState('');
  const [fCtaLabel, setFCtaLabel] = useState('');
  const [fCtaUrl, setFCtaUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    poolsApi
      .list()
      .then((r) => !cancelled && setPools(r.data))
      .catch(() => !cancelled && setError('Could not load pools'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const refresh = () => setReload((v) => v + 1);

  const openPool = (pool?: Pool) => {
    setError(null);
    setFTag(pool?.tag ?? '');
    setFTitle(pool?.title ?? '');
    setFDesc(pool?.description ?? '');
    setDialog({ kind: 'pool', pool });
  };

  const openItem = (poolId: string, poolTitle: string, item?: PoolItem) => {
    setError(null);
    setFAdvice(item?.adviceText ?? '');
    setFCtaLabel(item?.ctaLabel ?? '');
    setFCtaUrl(item?.ctaUrl ?? '');
    setDialog({ kind: 'item', poolId, poolTitle, item });
  };

  const savePool = async () => {
    if (dialog?.kind !== 'pool') return;
    setSaving(true);
    setError(null);
    try {
      if (dialog.pool) {
        await poolsApi.updatePool(dialog.pool.id, { title: fTitle.trim(), description: fDesc.trim() || null });
      } else {
        await poolsApi.createPool({
          tag: fTag.trim(),
          title: fTitle.trim(),
          description: fDesc.trim() || undefined,
        });
      }
      setDialog(null);
      refresh();
    } catch {
      setError('Could not save the pool. The tag may already exist.');
    } finally {
      setSaving(false);
    }
  };

  const saveItem = async () => {
    if (dialog?.kind !== 'item') return;
    setSaving(true);
    setError(null);
    try {
      if (dialog.item) {
        await poolsApi.updateItem(dialog.item.id, {
          adviceText: fAdvice.trim(),
          ctaLabel: fCtaLabel.trim() || null,
          ctaUrl: fCtaUrl.trim() || null,
        });
      } else {
        await poolsApi.createItem(dialog.poolId, {
          adviceText: fAdvice.trim(),
          ctaLabel: fCtaLabel.trim() || undefined,
          ctaUrl: fCtaUrl.trim() || undefined,
        });
      }
      setDialog(null);
      refresh();
    } catch {
      setError('Could not save the tip.');
    } finally {
      setSaving(false);
    }
  };

  const togglePool = async (p: Pool) => {
    await poolsApi.updatePool(p.id, { active: !p.active }).catch(() => setError('Update failed'));
    refresh();
  };
  const toggleItem = async (it: PoolItem) => {
    await poolsApi.updateItem(it.id, { active: !it.active }).catch(() => setError('Update failed'));
    refresh();
  };
  const removePool = async (p: Pool) => {
    if (!window.confirm(`Delete pool "${p.title}" and all its tips? This cannot be undone.`)) return;
    await poolsApi.deletePool(p.id).catch(() => setError('Delete failed'));
    refresh();
  };
  const removeItem = async (it: PoolItem) => {
    if (!window.confirm('Delete this tip?')) return;
    await poolsApi.deleteItem(it.id).catch(() => setError('Delete failed'));
    refresh();
  };

  const totalItems = pools.reduce((n, p) => n + p.items.length, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#F3E5F5] flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[#9C27B0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editorial Content</h1>
            <p className="text-sm text-gray-500">
              Curated recommendation pools — every word is reviewed by an editor. {pools.length} pools · {totalItems} tips.
            </p>
          </div>
        </div>
        <Button onClick={() => openPool()} className="gap-2 bg-[#9C27B0] hover:bg-[#7B1FA2]">
          <Plus className="w-4 h-4" /> New pool
        </Button>
      </div>

      {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : pools.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">No pools yet. Create your first one.</Card>
      ) : (
        <div className="space-y-4">
          {pools.map((pool) => (
            <Card key={pool.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-[#E6F0FA] text-[#3A7BD5] hover:bg-[#E6F0FA]">{pool.tag}</Badge>
                    {!pool.active && <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100">inactive</Badge>}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2">{pool.title}</h3>
                  {pool.description && <p className="text-sm text-gray-500 mt-0.5">{pool.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs text-gray-400">Active</span>
                    <Switch checked={pool.active} onCheckedChange={() => togglePool(pool)} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openPool(pool)} title="Edit pool">
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removePool(pool)} title="Delete pool">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Items */}
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                {pool.items.length === 0 && <p className="text-sm text-gray-400 italic">No tips yet.</p>}
                {pool.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className={`text-sm ${it.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                        {it.adviceText}
                      </p>
                      {it.ctaLabel && (
                        <span className="inline-flex items-center gap-1 text-xs text-[#3A7BD5] mt-1">
                          <ExternalLink className="w-3 h-3" />
                          {it.ctaLabel}
                          {it.ctaUrl ? ` → ${it.ctaUrl}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={it.active} onCheckedChange={() => toggleItem(it)} />
                      <Button variant="ghost" size="icon" onClick={() => openItem(pool.id, pool.title, it)} title="Edit tip">
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(it)} title="Delete tip">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openItem(pool.id, pool.title)}
                  className="gap-1.5 text-[#9C27B0] hover:bg-[#F3E5F5] mt-1"
                >
                  <Plus className="w-4 h-4" /> Add tip
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/edit dialog */}
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-lg">
          {dialog?.kind === 'pool' && (
            <>
              <DialogHeader>
                <DialogTitle>{dialog.pool ? 'Edit pool' : 'New pool'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Signal tag</Label>
                  <Input
                    value={fTag}
                    onChange={(e) => setFTag(e.target.value)}
                    placeholder="e.g. lower_back_pain"
                    disabled={!!dialog.pool}
                  />
                  <p className="text-xs text-gray-400">
                    Must match the snake_case tag produced by signal extraction. Cannot be changed after creation.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="e.g. Lower back care" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                <Button
                  onClick={savePool}
                  disabled={saving || !fTitle.trim() || (!dialog.pool && !fTag.trim())}
                  className="bg-[#9C27B0] hover:bg-[#7B1FA2]"
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialog?.kind === 'item' && (
            <>
              <DialogHeader>
                <DialogTitle>{dialog.item ? 'Edit tip' : 'New tip'}</DialogTitle>
                <p className="text-sm text-gray-500">in “{dialog.poolTitle}”</p>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Advice text (shown verbatim to patients)</Label>
                  <Textarea value={fAdvice} onChange={(e) => setFAdvice(e.target.value)} rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>CTA label</Label>
                    <Input value={fCtaLabel} onChange={(e) => setFCtaLabel(e.target.value)} placeholder="Read more" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA link</Label>
                    <Input value={fCtaUrl} onChange={(e) => setFCtaUrl(e.target.value)} placeholder="/patient/blog" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                <Button
                  onClick={saveItem}
                  disabled={saving || !fAdvice.trim()}
                  className="bg-[#9C27B0] hover:bg-[#7B1FA2]"
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
