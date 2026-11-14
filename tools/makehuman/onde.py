# Mostra onde o MPFB procura os dados (rodar: blender -b --factory-startup -P onde.py)
import addon_utils
addon_utils.enable("bl_ext.user_default.mpfb", default_set=True)
from bl_ext.user_default.mpfb.services.locationservice import LocationService
print("USERDATA", LocationService.get_user_data())
print("SYSDATA", LocationService.get_mpfb_data())
