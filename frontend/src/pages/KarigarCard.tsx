import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  BadgeCheck, Copy, Download, Loader2, MessageCircle, Package2, QrCode,
} from "lucide-react";
import { getPublicKarigarProfile } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const KarigarCard = () => {
  const { id } = useParams<{ id: string }>();
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["publicKarigar", id],
    queryFn: () => getPublicKarigarProfile(id as string),
    enabled: !!id,
    retry: false,
  });

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, { width: 320, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [shareUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar instead.");
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `karigar-${id}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const whatsappText = profile
    ? `Check out ${profile.full_name}'s Karigar card on ArtisanGPS: ${shareUrl}`
    : `Check out this Karigar card on ArtisanGPS: ${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border py-4 px-6 flex items-center justify-between">
        <Link to="/" className="font-display text-lg">
          ArtisanGPS <span className="font-hindi text-muted-foreground text-sm">· बहीखाता</span>
        </Link>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-data hidden sm:inline">
          Digital Karigar Card
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14 space-y-8">
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading Karigar card...
          </div>
        )}

        {isError && (
          <div className="text-center py-24 space-y-3">
            <div className="font-display text-2xl">Karigar card not found</div>
            <p className="text-sm text-muted-foreground">This link may be broken, or the artisan hasn't set up their card yet.</p>
            <Link to="/" className="inline-block text-sm text-primary hover:underline mt-2">← Back to ArtisanGPS</Link>
          </div>
        )}

        {profile && (
          <>
            {/* Hero */}
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card p-8 sm:p-10 text-center sm:text-left sm:flex items-center gap-8">
              <div className="w-28 h-28 mx-auto sm:mx-0 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-display text-5xl uppercase shrink-0">
                {profile.full_name.charAt(0)}
              </div>
              <div className="mt-6 sm:mt-0 flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-data">
                  {profile.craft_type || "Artisan"}{profile.location ? ` · ${profile.location}` : ""}
                </div>
                <h1 className="font-display text-3xl sm:text-4xl mt-1">{profile.full_name}</h1>
                <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                  {profile.gi_certified && (
                    <span className="text-[11px] uppercase tracking-wider font-data px-3 py-1 rounded-full bg-forest/10 text-forest border border-forest/30 inline-flex items-center gap-1.5">
                      <BadgeCheck size={12} /> GI Certified{profile.gi_year ? ` · ${profile.gi_year}` : ""}
                    </span>
                  )}
                  {profile.languages && (
                    <span className="text-[11px] uppercase tracking-wider font-data px-3 py-1 rounded-full bg-background border border-border">
                      {profile.languages}
                    </span>
                  )}
                  <span className="text-[11px] uppercase tracking-wider font-data px-3 py-1 rounded-full bg-background border border-border">
                    Karigar since {profile.member_since}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-5 py-2.5 rounded-full bg-forest text-forest-foreground inline-flex items-center gap-2 hover:opacity-90"
              >
                <MessageCircle size={14} /> Share on WhatsApp
              </a>
              <button
                onClick={() => setShowQr(true)}
                className="text-sm px-5 py-2.5 rounded-full border border-border bg-background inline-flex items-center gap-2 hover:bg-muted"
              >
                <QrCode size={14} /> Get QR Code
              </button>
              <button
                onClick={handleCopyLink}
                className="text-sm px-5 py-2.5 rounded-full border border-border bg-background inline-flex items-center gap-2 hover:bg-muted"
              >
                <Copy size={14} /> Copy link
              </button>
            </div>

            {/* Craft story */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-lg mb-3">Craft story</div>
              {profile.craft_story ? (
                <p className="text-sm text-foreground/85 leading-relaxed">{profile.craft_story}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">This karigar hasn't shared their story yet.</p>
              )}
            </div>

            {/* Product showcase */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package2 size={16} className="text-primary" />
                <div className="font-display text-lg">Products · {profile.products.length}</div>
              </div>
              {profile.products.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-2xl text-sm">
                  No products listed yet.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {profile.products.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                      {p.image_url && (
                        <div className="h-40 overflow-hidden">
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="font-display text-lg leading-tight">{p.name}</div>
                        {p.material && <div className="text-xs text-muted-foreground mt-0.5">{p.material}</div>}
                        <div className="font-data text-lg mt-2">{inr(p.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="text-center text-xs text-muted-foreground py-8">
        Powered by ArtisanGPS
      </footer>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Scan to view this Karigar card</DialogTitle>
          </DialogHeader>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code linking to this Karigar card" className="mx-auto rounded-lg border border-border" />
          ) : (
            <div className="py-10 text-muted-foreground text-sm">Generating QR code...</div>
          )}
          <div className="flex justify-center gap-2 mt-2">
            <Button onClick={handleDownloadQr} disabled={!qrDataUrl}>
              <Download size={14} className="mr-1.5" /> Download QR
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy size={14} className="mr-1.5" /> Copy link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KarigarCard;
