/*  SmartViewer.tsx – versiune completă, cu update live la titlu
 *  - entityColors: [{ id, color, annotation:{ title } }]
 *  - marker-ele urmăresc entităţile; eroarea „values undefined” remediată
 */

import * as React from "react";
import {
  ComponentMeta, ComponentProps, PComponent,
  PropertyTree, SizeObject
} from "@inductiveautomation/perspective-client";

import {
  Viewer, XKTLoaderPlugin,
  AmbientLight, DirLight,
  NavCubePlugin, TreeViewPlugin, AnnotationsPlugin, math,
} from "@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js";

export const COMPONENT_TYPE = "rad.display.smartViewer";

/*──────── tipuri ────────*/
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

/*──────── utilitare ─────*/
const hexToRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];
const getEntityCenter = (ent: any): [number, number, number] => {
  const p = math.getAABB3Center(ent.aabb);
  return [p[0], p[1], p[2]];
};

/*──────── componenta ───*/
const SmartViewer: React.FC<ComponentProps<SmartViewerProps>> = ({ props, emit }) => {
  const { source, backgroundColor, entityColors } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = React.useRef<{
    viewer: any;
    xktLoader: any;
    annotations: any;
  }>();

  /*──────── init ───────*/
  React.useEffect(() => {
    if (viewerRef.current) return; 
    if (!containerRef.current) return;

    /* canvas principal */
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%";
    containerRef.current.appendChild(canvas);

    /* NavCube */
    const navCanvas = document.createElement("canvas");
    navCanvas.style.cssText = `
      position:absolute;bottom:10px;left:10px;width:120px;height:120px;z-index:1000`;
    containerRef.current.appendChild(navCanvas);

    /* blocăm scroll-ul paginii */
    canvas.addEventListener("wheel", e => e.preventDefault(), { passive:false });

    /* container TreeView */
    const treeDiv = document.createElement("div");
    treeDiv.style.cssText = `
      position:absolute;top:10px;right:10px;width:200px;height:300px;
      overflow:auto;background:rgba(255,255,255,.8);z-index:1000;
      padding:8px;border-radius:4px;font-size:12px`;
    containerRef.current.appendChild(treeDiv);

    /* Viewer */
    const [r, g, b] = hexToRgb(backgroundColor);
    const viewer = new Viewer({ canvasElement: canvas, backgroundColor: [r, g, b] });
    viewer.scene.gammaOutput = true;
    viewer.scene.gammaFactor = 2.2;

    const camCtrl = viewer.cameraControl as any;
    camCtrl.navMode = "orbit";
    camCtrl.followPointer = true;

    new AmbientLight(viewer.scene, { color: [1, 1, 1], intensity: 0.6 });
    new DirLight(viewer.scene, { dir: [-0.5, -0.8, -0.3], color: [1, 1, 1], intensity: 1 });

    const xktLoader = new XKTLoaderPlugin(viewer);
    new NavCubePlugin(viewer, { canvasElement: navCanvas, visible: true } as any);

    /* TreeView */
    const treeView = new TreeViewPlugin(viewer, {
      containerElement: treeDiv,
      hierarchy: "containment",
      autoExpandDepth: 1,
    });
    treeView.on("nodeTitleClicked", e => addOrUpdateAnnotation(e.treeViewNode.objectId, e.treeViewNode.objectId));

    const annotations = new AnnotationsPlugin(viewer, {
      markerHTML: `<div class="sv-annotation-marker">{{glyph}}</div>`,
      labelHTML : `<div class="sv-annotation-label">{{title}}</div>`,
      values    : { glyph:"●", title:"" }
    });

    viewerRef.current = { viewer, xktLoader, annotations };
    return () => viewer.destroy();
  }, []);

  /*──────── culori ─────*/
  const applyColors = () => {
    const ctx = viewerRef.current; if (!ctx) return;
    entityColors?.forEach(({ id, color }) => {
      if (!color) return;
      const ent = ctx.viewer.scene.objects[id];
      if (ent) ent.colorize = hexToRgb(color);
    });
  };

  /*──────── add / update single ─────*/
  const addOrUpdateAnnotation = (entityId: string, title: string) => {
    const ctx = viewerRef.current; if (!ctx) return;
    const plugin = ctx.annotations;
    const ent    = ctx.viewer.scene.objects[entityId]; if (!ent) return;

    if (plugin.annotations?.[entityId]) {
      plugin.annotations[entityId].setValues({ title });
      plugin.annotations[entityId].setMarkerShown(true);
      plugin.annotations[entityId].setLabelShown(true);
    } else {
      plugin.createAnnotation({
        id: entityId,
        entity: ent,
        worldPos: getEntityCenter(ent),
        markerShown:true,
        labelShown :true,
        values:{ glyph:"●", title }
      });
    }

    /* persistăm în array */
    const list = props.entityColors || [];
    const idx  = list.findIndex(e => e.id === entityId);
    const upd  = idx>=0
      ? list.map((e,i)=> i===idx ? { ...e, annotation:{ title }} : e)
      : [...list, { id:entityId, color:"#ff0000", annotation:{ title }}];

    emit({ entityColors: upd }, true);
  };

  /*──────── sync global ─────*/
  const syncAnnotations = () => {
    const ctx = viewerRef.current; if (!ctx) return;
    const plugin = ctx.annotations;

    entityColors?.forEach(({ id, annotation }) => {
      const t = annotation?.title; if (!t) return;
      const ent = ctx.viewer.scene.objects[id]; if (!ent) return;

      if (plugin.annotations?.[id]) {
        if (plugin.annotations[id].values?.title !== t) {   // fix nul title
          plugin.annotations[id].setValues({ title: t });
        }
      } else {
        plugin.createAnnotation({
          id, entity: ent, worldPos: getEntityCenter(ent),
          markerShown:true, labelShown:true,
          values:{ glyph:"●", title:t }
        });
      }
    });

    /* orfani (opţional) */
    Object.keys(plugin.annotations || {}).forEach((id) => {
      const stillListed = entityColors?.some(
        (e) => e.id === id && e.annotation?.title
      );
    
      if (!stillListed) {
        /* în build-ul actual destroy() este metoda sigură */
        plugin.annotations[id].destroy();
        delete plugin.annotations[id];
      }
    });
  };

  /*──────── load model ─────*/
  React.useEffect(() => {
    const ctx = viewerRef.current; if (!ctx || !source) return;

    const model = ctx.xktLoader.load({ id:"model", src:source, edges:true });
    model.on("loaded", () => {
      ctx.viewer.cameraFlight.flyTo({ aabb: model.aabb });
      applyColors();
      syncAnnotations();
    });
  }, [source]);

  /*──────── efecte live ───*/
  React.useEffect(applyColors,      [entityColors]);
  React.useEffect(syncAnnotations,  [entityColors]);

  return (
    <div {...emit()} ref={containerRef}
         style={{ width:"100%", height:"100%", position:"relative" }} />
  );
};

/*──────── META ───────*/
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
