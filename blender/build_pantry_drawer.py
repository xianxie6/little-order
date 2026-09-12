"""Open oak pantry tray, authored in the same envelope as the original drawer."""
from pathlib import Path
source=Path(__file__).with_name('build_assets.py').read_text()
exec(source.split('\nstart=set(bpy.context.scene.objects)')[0])
oak=mat('pantry oak',(.59,.36,.16),.52)
rail=mat('pantry rail',(.67,.44,.22),.43)
end=mat('pantry endgrain',(.47,.28,.12),.64)
handle=mat('pantry satin metal',(.67,.60,.46),.28,.82)
start=set(bpy.context.scene.objects)
box('solid oak tray floor',(0,0,.035),(1.54,1.0,.06),oak,.015)
# Low solid sides and open balustrades keep contents visible above the front board.
for x in [-.752,.752]:
 box('oak side board',(x,0,.145),(.055,1.0,.22),oak,.008)
 for y in [-.465,.465]:
  box('square corner post',(x,y,.28),(.052,.052,.285),rail,.008)
 post=cyl('round side guard rail',(x,0,.407),.019,.97,rail,24);post.rotation_euler.x=math.pi/2
 box('concealed runner',(x,.02,.019),(.025,.92,.035),handle,.006)
for y in [-.493,.493]:
 # The transparent front and its handle are supplied by dressDrawer in the app.
 if y>0:box('oak end board',(0,y,.145),(1.51,.05,.22),oak,.009)
 post=cyl('round front guard rail',(0,y,.407),.019,1.50,rail,24);post.rotation_euler.y=math.pi/2
 # Contrasting finger joints at the tray corners.
 for x in ([-.719,.719] if y>0 else []):
  for z in [.08,.14,.20]:box('oak finger joint',(x,y*1.043,z),(.06,.008,.027),end,.002)
export('drawer-pantry',start)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','pantry-drawer.blend'))
