import bpy, math, os, random
from mathutils import Vector
random.seed(83)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'public','models')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def mat(name,color,rough=.4,metal=0,trans=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;p.inputs['Transmission Weight'].default_value=trans;p.inputs['IOR'].default_value=1.46
 return m
ivory=mat('porcelain enamel',(.80,.83,.79),.26,.15)
liner=mat('cool interior',(.66,.72,.67),.4)
metal=mat('brushed aluminum',(.54,.59,.55),.29,.82)
chrome=mat('polished edge',(.7,.76,.72),.17,.86)
clear=mat('clear recycled plastic',(.87,.95,.92),.1,0,.92)
rim=mat('frosted edges',(.7,.82,.76),.22,0,.35)
white=mat('warm paper',(.94,.92,.84),.48)
blue=mat('milk blue',(.23,.45,.56),.35)
ink=mat('bottle ink',(.16,.25,.24),.65)
pink=mat('peach enamel',(.71,.36,.39),.26,.24)
peach=mat('peach label',(.96,.70,.53),.5)
green=mat('leaf green',(.19,.35,.12),.5)
yogurt=mat('sage label',(.43,.55,.33),.42)
eggmat=mat('eggshell',(.77,.57,.36),.6)
stemmat=mat('natural stem',(.19,.10,.04),.7)
red=mat('apple skin',(.58,.055,.027),.26)
orange=mat('orange peel',(.93,.37,.022),.48)
for m,scale,strength in [(red,95,.085),(orange,65,.2),(eggmat,130,.04)]:
 n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale;bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=strength;bump.inputs['Distance'].default_value=.025;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
# Shapes are authored with Z up; glTF export converts them to Y up.
def finish(o,name,m):
 o.name=name;o.data.materials.append(m)
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
 return o

def box(name,loc,size,m,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('manufactured round edges','BEVEL');mod.width=bevel;mod.segments=3
 mod=o.modifiers.new('weighted corner normals','WEIGHTED_NORMAL');return finish(o,name,m)

def uv(name,loc,scale,m,segments=32,rings=20):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,m)

def cyl(name,loc,r,depth,m,verts=48):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc);o=bpy.context.object;be=o.modifiers.new('rolled edge','BEVEL');be.width=.008;be.segments=3;o.modifiers.new('smooth normals','WEIGHTED_NORMAL');return finish(o,name,m)

def torus(name,loc,r,minor,m):
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=minor,major_segments=48,minor_segments=8,location=loc);return finish(bpy.context.object,name,m)

def text(name,body,loc,size,m):
 return None

def leaf(loc,size=.16,rotation=0):
 verts=[];faces=[]
 for i in range(13):
  t=i/12;w=math.sin(math.pi*t)*size*.35
  for side in [-1,0,1]:verts.append((side*w,t*size,math.sin(math.pi*t)*size*.17))
 for i in range(12):
  for j in range(2):a=i*3+j;faces.append((a,a+1,a+4,a+3))
 me=bpy.data.meshes.new('curved leaf');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('leaf',me);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(.5,.2,rotation);finish(o,'leaf',green)

def export(name,start):
 obs=[o for o in bpy.context.scene.objects if o not in start];bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0]
 # Mesh conversion bakes bevels and preserves packaging typography.
 bpy.ops.object.convert(target='MESH')
 groups={}
 for o in list(bpy.context.selected_objects):groups.setdefault(o.active_material.name,[]).append(o)
 joined=[]
 for objects in groups.values():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0]
  if len(objects)>1:bpy.ops.object.join()
  joined.append(bpy.context.view_layer.objects.active)
 obs=joined
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_apply=True)
 col=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(col)
 for o in obs:
  for c in list(o.users_collection):c.objects.unlink(o)
  col.objects.link(o)
 return col

start=set(bpy.context.scene.objects)
box('back insulated panel',(0,.57,2.43),(3.65,.13,4.86),ivory,.09)
box('interior back',(0,.49,2.42),(3.38,.055,4.49),liner,.04)
for x in [-1.77,1.77]:box('rounded cabinet stile',(x,0,2.43),(.18,1.3,4.86),ivory,.07)
for z in [.12,4.75]:box('cabinet crown',(0,0,z),(3.54,1.3,.22),ivory,.07)
# Shelves and dividers are dynamic in the web scene.
for x in [-1.56,1.56]:
 box('vertical light diffuser',(x,.435,2.43),(.027,.027,4.19),white,.008)
for i in range(27):box('upper ventilation slot',(-1.05+i*.08,.445,4.46),(.025,.012,.08),metal,.006)
text('cabinet logo','L I T T L E   F R E S H',(0,-.657,4.73),.075,ink)
for x in [-1.4,1.4]:box('rubber foot',(x,.15,-.025),(.20,.55,.14),metal,.035)
export('cabinet',start)

start=set(bpy.context.scene.objects)
box('transparent base',(0,0,.035),(1.54,1.0,.06),clear,.025)
for x in [-.754,.754]:
 box('clear sidewall',(x,0,.22),(.036,1.0,.38),clear,.018)
 box('top rolled side lip',(x,0,.415),(.043,1.01,.035),rim,.012)
 box('moving drawer runner',(x,-.05,.015),(.035,.97,.045),chrome,.007)
for y in [-.495,.495]:
 box('front and back wall',(0,y,.22),(1.53,.035,.38),clear,.02)
 box('top rolled lip',(0,y,.415),(1.53,.044,.035),rim,.013)
box('finger pull',(0,-.539,.32),(.4,.065,.075),rim,.025)
# No labels: drawers have no preset contents.
export('drawer',start)

start=set(bpy.context.scene.objects)
box('milk carton body',(0,0,.315),(.34,.30,.60),white,.014)
# Folded gable: six vertices form the triangular roof.
verts=[(-.17,-.15,.61),(.17,-.15,.61),(0,-.15,.77),(-.17,.15,.61),(.17,.15,.61),(0,.15,.77)]
faces=[(0,1,2),(3,5,4),(0,3,4,1),(0,2,5,3),(1,4,5,2)]
me=bpy.data.meshes.new('gable fold');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('folded carton roof',me);bpy.context.collection.objects.link(o);finish(o,o.name,blue)
box('sealed ridge',(0,0,.78),(.025,.31,.035),white,.004)
box('front blue print',(0,-.151,.35),(.32,.006,.29),blue,.003)
text('milk brand','MILK',(0,-.158,.365),.071,white);text('milk detail','FARM FRESH',(0,-.159,.297),.025,white);text('milk volume','250 ml',(0,-.159,.125),.024,ink)
for i in range(12):box('printed barcode',(-.09+i*.014,.153,.18),(.005,.003,.085),ink,.0005)
export('milk',start)

start=set(bpy.context.scene.objects)
cyl('aluminum can',(0,0,.34),.18,.63,pink)
for z in [.038,.66]:torus('rolled aluminum seam',(0,0,z),.165,.013,chrome)
cyl('recessed can top',(0,0,.659),.155,.012,metal)
uv('opening',(0,-.064,.67),(.04,.057,.003),ink)
pull=torus('pull tab',(0,.025,.68),.04,.01,chrome);pull.scale=(.66,1, .5)
box('cream label',(0,-.178,.345),(.225,.014,.29),white,.05)
text('peach type','PEACH',(0,-.19,.411),.044,pink)
uv('peach icon',(-.023,-.193,.326),(.048,.014,.05),peach);uv('peach icon',(.021,-.193,.326),(.048,.014,.05),peach)
text('soda small type','SPARKLING',(0,-.191,.25),.021,ink)
for i in range(9):
 a=random.uniform(-1.15,1.15);z=random.uniform(.1,.57);uv('condensation bead',(math.sin(a)*.183,-math.cos(a)*.183,z),(.008,.006,.013),clear,12,8)
export('soda',start)

start=set(bpy.context.scene.objects)
a=uv('sculpted apple',(0,0,.23),(.235,.22,.235),red,48,32)
for v in a.data.vertices:
 z=v.co.z/.235;t=math.atan2(v.co.y,v.co.x);factor=1+.028*math.cos(t*5)*abs(z)**3;v.co.x*=factor;v.co.y*=factor
 if z>.55:v.co.z-=.06*((z-.55)/.45)**2
stem=cyl('apple stem',(.009,0,.45),.013,.14,stemmat,16);stem.rotation_euler=(.13,.22,0)
leaf((.018,0,.48),.19,-1.0)
for i in range(75):
 a=random.uniform(0,math.tau);z=random.uniform(-.7,.7);r=math.sqrt(1-z*z);uv('skin lenticel',(.236*r*math.cos(a),.221*r*math.sin(a),.23+.235*z),(.0016,.0016,.0016),peach,6,4)
export('apple',start)

start=set(bpy.context.scene.objects)
uv('mandarin',(0,0,.225),(.235,.235,.218),orange,48,32)
cyl('stem scar',(0,0,.443),.026,.012,green,20)
leaf((.006,0,.45),.17,-.7)
# Physical pore geometry survives glTF without procedural shader support.
for i in range(340):
 z=random.uniform(-.92,.92);a=random.uniform(0,math.tau);r=math.sqrt(1-z*z);uv('peel pore',(.2355*r*math.cos(a),.2355*r*math.sin(a),.225+.219*z),(.0018,.0018,.0015),peach,6,4)
export('orange',start)

start=set(bpy.context.scene.objects)
bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.15,radius2=.21,depth=.34,location=(0,0,.19));finish(bpy.context.object,'tapered yogurt cup',white)
# Printed band follows the taper.
bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.177,radius2=.201,depth=.14,location=(0,0,.235));finish(bpy.context.object,'sage paper sleeve',yogurt)
cyl('foil lid',(0,0,.37),.222,.018,metal)
cyl('lid print',(0,0,.381),.205,.004,yogurt)
box('foil pull corner',(.193,0,.373),(.1,.09,.008),metal,.012)
text('yogurt type','yogurt',(0,-.200,.235),.057,white)
text('yogurt type small','NATURAL',(0,-.202,.198),.021,white)
export('yogurt',start)

start=set(bpy.context.scene.objects)
a=uv('egg',(0,0,.265),(.175,.175,.257),eggmat,40,28)
for v in a.data.vertices:
 z=v.co.z/.257;v.co.x*=1-.19*z;v.co.y*=1-.19*z
export('egg',start)

# Keep an editable, well-arranged Blender source file with all collections.
for idx,col in enumerate([c for c in bpy.data.collections if c.name in ['milk','soda','apple','orange','yogurt','egg']]):
 for o in col.objects:o.location.x+=5+(idx%3)*1.3;o.location.y+=(idx//3)*1.5
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','little-order.blend'))
print('ASSETS_READY',OUT)
