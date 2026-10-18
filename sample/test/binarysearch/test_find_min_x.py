"""
Find the smallest x such that x^2 >= n
"""

### __FRONT_TEXT_END__
import pytest


def find_min_x(n):  # O(log(N))
    lo, hi = 0, 2**32
    while lo < hi:
        mi = (lo + hi) // 2
        if mi * mi >= n:
            hi = mi
        else:
            lo = mi + 1
    return hi


def find_min_x_naive(n):  # O(sqrt(N))
    x = 0
    while x * x < n:
        x += 1
    return x


@pytest.mark.parametrize(
    "args,expected",
    [
        [[0], 0],
        [[1], 1],
        [[8], 3],
        [[9], 3],
        [[10], 4],
        [[(n := 12345) * n - 1], n],
        [[n * n], n],
        [[n * n + 1], n + 1],
    ],
)
def test(args, expected):
    assert find_min_x(*args) == expected
    assert find_min_x_naive(*args) == expected
