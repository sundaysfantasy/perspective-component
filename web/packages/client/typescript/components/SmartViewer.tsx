import * as React from "react";
import {
  ComponentMeta, ComponentProps, PComponent,
  PropertyTree, SizeObject
} from "@inductiveautomation/perspective-client";

import {
  Viewer, XKTLoaderPlugin, AmbientLight, DirLight,
  NavCubePlugin, TreeViewPlugin, AnnotationsPlugin
} from "@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js";

export const COMPONENT_TYPE = "rad.display.smartViewer";

/* ── tipuri ─────────────────────────────────────── */
interface EntityColor {
  id: string;
  color?: string;
  annotation?: { title?: string };
}
interface SmartViewerProps {
  source: string;
  backgroundColor: string;
  entityColors: EntityColor[];
}

const hexToRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

/* ── COMPONENTA ─────────────────────────────────── */
const SmartViewer: React.FC<ComponentProps<SmartViewerProps>> = ({ props, emit }) => {
  const { source, backgroundColor, entityColors } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = React.useRef<{
    viewer: any;
    xktLoader: any;
    annotations: any;
  }>();

  /* ── INITIALIZARE ───────────────────────────── */
  React.useEffect(() => {
    if (!containerRef.current) return;

    /* canvas principal */
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%";
    containerRef.current.appendChild(canvas);

    /* navcube */
    const navCanvas = document.createElement("canvas");
    navCanvas.style.cssText =
      "position:absolute;bottom:10px;left:10px;width:120px;height:120px;z-index:1000";
    containerRef.current.appendChild(navCanvas);

    /* tree container */
    const treeDiv = document.createElement("div");
    treeDiv.style.cssText =
      "position:absolute;top:10px;right:10px;width:200px;height:300px;overflow:auto;" +
      "background:rgba(255,255,255,.8);z-index:1000;padding:8px;border-radius:4px;font-size:12px";
    containerRef.current.appendChild(treeDiv);

    const [r, g, b] = hexToRgb(backgroundColor);

    const viewer = new Viewer({ canvasElement: canvas, backgroundColor: [r, g, b] });
    viewer.scene.gammaOutput = true;
    viewer.scene.gammaFactor = 2.2;

    new AmbientLight(viewer.scene, { color: [1, 1, 1], intensity: 0.6 });
    new DirLight(viewer.scene, { dir: [-0.5, -0.8, -0.3], color: [1, 1, 1], intensity: 1 });

    const xktLoader = new XKTLoaderPlugin(viewer);
    new NavCubePlugin(viewer, { canvasElement: navCanvas, visible: true } as any);

    const treeView = new TreeViewPlugin(viewer, {
      containerElement: treeDiv,
      hierarchy: "containment",
      autoExpandDepth: 1,
    });

    treeView.on("nodeTitleClicked", (e) => {
      const id = e.treeViewNode.objectId;
      addOrUpdateAnnotation(id, id);
    });

    const annotations = new AnnotationsPlugin(viewer, {
      markerHTML: `<div class="sv-annotation-marker">{{glyph}}</div>`,
      labelHTML : `<div class="sv-annotation-label">{{title}}</div>`,
      values    : { glyph: "●", title: "" }
    });

    viewerRef.current = { viewer, xktLoader, annotations };
    return () => viewer.destroy();
  }, []);

  /* ── helper: culori ─────────────────────────── */
  const applyColors = () => {
    const ctx = viewerRef.current;
    if (!ctx) return;
    entityColors?.forEach(({ id, color }) => {
      if (!color) return;
      const ent = ctx.viewer.scene.objects[id];
      if (ent) ent.colorize = hexToRgb(color);
    });
  };

  /* ── helper: adaugă / update annotation ─────── */
  const addOrUpdateAnnotation = (entityId: string, title: string) => {
    const ctx = viewerRef.current; if (!ctx) return;

    const ent = ctx.viewer.scene.objects[entityId];
    if (!ent) return;

    const ann = ctx.annotations.annotations?.[entityId];
    if (ann) ann.setValues({ title });
    else ctx.annotations.createAnnotation({
      id: entityId, entity: ent,
      markerShown: true, labelShown: true,
      values: { glyph: "●", title }
    });

    /* actualizează lista entityColors */
    const list = props.entityColors || [];
    const idx  = list.findIndex(e => e.id === entityId);
    const updated = idx >= 0
      ? list.map((e,i)=> i===idx ? { ...e, annotation:{ title } } : e)
      : [...list, { id: entityId, color: "#ff0000", annotation:{ title } }];

    emit({ entityColors: updated }, true);   // true ⇒ refresh instant în Designer
  };

  /* ── ÎNCARCĂ MODEL ─────────────────────────── */
  React.useEffect(() => {
    const ctx = viewerRef.current; if (!ctx || !source) return;

    const model = ctx.xktLoader.load({ id:"model", src:source, edges:true });

    model.on("loaded", () => {
      ctx.viewer.cameraFlight.flyTo({ aabb: model.aabb });
      applyColors();
      /* recreăm etichetele */
      props.entityColors?.forEach(({ id, annotation }) => {
        const t = annotation?.title; if (!t) return;
        if (ctx.annotations.annotations?.[id]) return;
        const ent = ctx.viewer.scene.objects[id];
        if (ent) ctx.annotations.createAnnotation({
          id, entity: ent,
          markerShown:true, labelShown:true,
          values:{ glyph:"●", title:t }
        });
      });
    });
  }, [source]);

  React.useEffect(applyColors, [entityColors]);   // live color update

  return (
    <div {...emit()} ref={containerRef}
         style={{ width:"100%", height:"100%", position:"relative" }} />
  );
};

/* ── META ─────────────────────────────────────── */
export class SmartViewerMeta implements ComponentMeta {
  getComponentType(){ return COMPONENT_TYPE; }
  getViewComponent(): PComponent{ return SmartViewer; }
  getDefaultSize(): SizeObject{ return { width:400, height:300 }; }

  getPropsReducer(tree: PropertyTree): SmartViewerProps {
    const entityColors = tree.read("entityColors", []).map((it:any)=>({
      id: it.id || "",
      color: it.color || "#ff0000",
      annotation: it.annotation || {}
    }));
    return {
      source: tree.readString("source",""),
      backgroundColor: tree.readString("backgroundColor","#f0f0f0"),
      entityColors
    };
  }
}

export { SmartViewer };
