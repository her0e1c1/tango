"""
Find the largest x such that x^2 <= n
"""

### __FRONT_TEXT_END__
import pytest


def find_max_x(n):  # O(log(N))
    lo, hi = 0, 2**32
    while lo < hi:
        mi = (lo + hi + 1) // 2  # Need +1 for finding max
        if mi * mi <= n:
            lo = mi
        else:
            hi = mi - 1
    return lo


def find_max_x_naive(n):  # O(sqrt(N))
    x = 0
    while x * x <= n:
        x += 1
    return x - 1


@pytest.mark.parametrize(
    "args,expected",
    [
        [[0], 0],
        [[1], 1],
        [[8], 2],
        [[9], 3],
        [[10], 3],
        [[(n := 12345) * n - 1], n - 1],
        [[n * n], n],
        [[n * n + 1], n],
    ],
)
def test(args, expected):
    assert find_max_x(*args) == expected
    assert find_max_x_naive(*args) == expected
