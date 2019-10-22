import matplotlib.pyplot as plt
from matplotlib.testing.decorators import image_comparison,check_figures_equal

@check_figures_equal(extensions=["png"])
def test_image(fig_test, fig_ref):
    x=plt.Circle((0,0), 0.2, color='r', clip_on=False)
    fig_ref.subplots().add_artist(x)
    y=plt.Circle((0,0), 0.2, color='r', clip_on=False)
    fig_test.subplots().add_artist(y)
