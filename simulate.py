import numpy as np

def simulateLorenz(sigma=10.0, rho=28.0, beta=2.667, dt=0.01, numSteps=1000, x_i=1.0, y_i=0.0, z_i=0.0):
    n = int(numSteps)
    xs = np.empty(n)
    ys = np.empty(n)
    zs = np.empty(n)
    x = float(x_i); y = float(y_i); z = float(z_i)
    for i in range(n):
        xs[i] = x
        ys[i] = y
        zs[i] = z
        dx = sigma * (y - x)
        dy = rho * x - y - x * z
        dz = x * y - beta * z
        x = x + dt * dx
        y = y + dt * dy
        z = z + dt * dz
    return { "x": xs.tolist(), "y": ys.tolist(), "z": zs.tolist() }
